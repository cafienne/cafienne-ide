import $ajax, { AjaxError } from "@util/ajax";
import Util from "@util/util";
import XML from "@util/xml";
import ModelDefinition from "../definition/modeldefinition";
import RepositoryBase from "../repositorybase";
import Metadata from "./metadata";
import ServerFileReferences from "./serverfilereferences";

export default class ServerFile<M extends ModelDefinition> {
    private _fileName: any;
    private _source: any;
    private _definition?: M;
    private _xml?: Element;

    fileType: string;
    name: string;
    references: ServerFileReferences<M> = new ServerFileReferences(this);
    metadata: Metadata;
    lastModified: string = '';
    hasBeenSavedJustNow: boolean = false;
    clearing: boolean = false;

    /**
     * Creates a new local reference of the server file, based on the json structure given
     * by the server (serverData).
     * When created the reference does not yet hold the content. This can be loaded on 
     * demand through the load method, which can be invoked with a callback.
     */
    constructor(public repository: RepositoryBase, fileName: string, source: any) {
        this.repository = repository;
        this.name = ''; // Will be filled when the file name is set - which is also done after succesful rename actions
        this.fileType = ''; // Will be filled when the file name is set
        this.fileName = fileName;
        this.source = source;
        this.metadata = new Metadata({});
    }

    /**
     * Note: this method is private/protected
     */
    createModelDefinition(): M {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    get fileName() {
        return this._fileName;
    }

    /**
     * @param {String} fileName
     */
    set fileName(fileName) {
        if (fileName !== this._fileName) {
            this._fileName = fileName;
            // Split:  divide "myMap/myMod.el.case" into ["MyMap/myMod", "el", "case"]
            const splitList = fileName.split('.');
            this.fileType = splitList.pop(); // Last one is extension
            this.name = splitList.join('.'); // name becomes "MyMap/myMod.el"
        }
    }

    /**
     * Refreshes the metadata of the model, based on the server side content.
     */
    refreshMetadata(serverMetadata: Metadata) {
        this.metadata = serverMetadata;
        if (this.lastModified === serverMetadata.lastModified || this.hasBeenSavedJustNow) {
            // still the same contents, but potentially a new lastmodified timestamp
            // console.log("Data of "+this.fileName+" has not changed on the server-side");
            if (this.lastModified !== serverMetadata.lastModified) {
                // console.log("Updating timestamp of "+this.fileName+" from "+new Date(this.lastModified)+" to "+new Date(serverMetadata.lastModified));
                this.lastModified = serverMetadata.lastModified;
            }
        } else {
            console.log("Clearing contents of " + this.fileName + ", since server indicates there is new content")
            this.clear();
        }
        if (serverMetadata.serverContent) {
            this.source = serverMetadata.serverContent;
        }
        this.lastModified = serverMetadata.lastModified;
    }

    get source() {
        return this._source;
    }

    set source(source) {
        if (this._source !== source) {
            this._source = source;
            const xml = XML.parseXML(source);
            this._xml = xml ? xml.documentElement : xml;
        }
    }

    get definition(): M | undefined {
        return this._definition;
    }

    get xml() {
        return this._xml;
    }

    /**
      *  Returns an array with id/name of the files where this file is used in 
      */
    get usage() {
        return this.metadata?.usage;
    }

    /**
     *  @returns {Array<ServerFile>} Array with ServerFile's of the files where this file is used in 
     */
    get usageFiles() {
        return this.usage?.map(usage => usage.id).map(fileName => this.repository.list.find(file => file.fileName === fileName))
    }

    /**
     * File no longer exists in server...
     */
    deprecate() {
        // TODO: here we should check if there are any editors that are still open for this serverFile;
        //  if so, then we should show a message in those editors in an overlay, with a decision what to do.
        console.warn(`Still using ${this.fileName} ???  Better not, since it no longer exists in the server ...`);
    }

    /**
     * Removes local content caches, in order to enforce reloading of the file when it's content is read.
     */
    clear() {
        if (this.clearing) {
            return;
        }
        if (this.source === undefined && !this.definition) {
            // Nothing to clear here
            return;
        }
        console.groupCollapsed(`Clearing the contents of ${this.fileName} and ${this.references.size} referenced files`);
        this.clearing = true;
        this.source = undefined;
        this._definition = undefined;
        this.references.clear();
        this.clearing = false;
        console.groupEnd();
    }

    /**
     * Loads the data of file and parses it to a definition.
     */
    async fetch(): Promise<ServerFile<M>> {
        if (this.source) {
            // console.log("We have a source here, no need to further fetch ")
            return Promise.resolve(this);
        }

        const url = '/repository/load/' + this.fileName;
        const type = 'get';
        console.log('Loading ' + url);

        // Simple method for easy checking whether the functionality is still working ...
        // this.usage();

        const response = await $ajax({ type, url }).catch((error: AjaxError) => {
            if (error.xhr && error.xhr.status === 404) {
                throw `File "${this.fileName}" cannot be found in the repository. Perhaps it has been deleted`;
            } else {
                throw error;
            }
        });
        if (response.xhr.responseText === '') {
            const msg = this.fileName + ' does not exist or is an empty file in the repository';
            console.warn(msg);
            // we could reject?
        }
        console.log(`Fetched ${this.fileName}, calling parse with data `, response.data);
        this.source = response.data;
        await this.parse();
        console.log(`Parse ${this.fileName} is done`);
        return this;
    }

    /**
     * Parse the document and "then" callback
     */
    async parse(): Promise<ServerFile<M>> {
        // console.groupEnd();
        // console.log("Parsing " + this.fileName);
        if (!this.source) {
            console.warn("No source content to parse")
            return Promise.resolve(this);
        }
        if (!this.xml) {
            // There is no xml definition available to parse ...
            if (this.metadata) this.metadata.error = 'This file does not contain a valid XML document to parse';
            return this;
        }
        const definition = this.createModelDefinition();
        this._definition = definition;
        definition.validateDocument();
        if (definition.hasMigrated()) {
            console.log(`${definition.constructor.name} of '${this.fileName}' has migrated; uploading result`);
            this.source = definition.toXML();
            await this.save();
        }
        await definition.loadDependencies();
        // console.log("File["+file.fileName+"].definition: " + file.definition);
        this.validateDefinition();
        return this;
    }

    /**
     * Hook to enable server files to check the actual definition for validity.
     * Used specifically in CaseFile to verify that the dimensions exist.
     */
    validateDefinition() {
    }

    /**
     * Load the file and parse it.
     * If the source of the file is not present, then it will be fetched from the server.
     */
    async load(): Promise<ServerFile<M>> {
        await this.fetch();
        if (!this.definition) {
            // console.log(`Parsing ${this.fileName} upon loading`)
            await this.parse();
        }
        return this;
    }

    /**
     * Clear the contents of the file and load it again from the server.
     */
    async reload() {
        this.clear();
        return this.load();
    }

    /**
     * Uploads the XML content to the server, and invokes the callback after it.
     * Uploading to server gives also a new file list back, which we use to update the repository contents.
     */
    async save() {
        if (!this.repository.isExistingModel(this.fileName)) { // temporary hack (i hope). creation should take care of this, instead of saving.
            this.repository.list.push(this);
        }

        const xmlString = XML.prettyPrint(this.source);
        const url = '/repository/save/' + this.fileName;
        const type = 'post';
        console.groupCollapsed('Saving ' + this.fileName);
        const response = await $ajax({ url, data: xmlString, type, headers: { 'content-type': 'application/xml' } }).catch(() => {
            console.groupEnd();
            throw 'We could not save your work due to an error in the server. Please refresh the browser and make sure the server is up and running';
        });
        this.hasBeenSavedJustNow = true;
        this.repository.updateMetadata(response.data);
        this.hasBeenSavedJustNow = false;
        // Also print a timestampe of the new last modified information
        const lmDate = new Date(this.lastModified);
        const HHmmss = lmDate.toTimeString().substring(0, 8);
        const millis = ('000' + lmDate.getMilliseconds()).substr(-3);
        console.log('Uploaded ' + this.fileName + ' at ' + HHmmss + ':' + millis);
        console.groupEnd();
        return response;
    }

    /**
     * Gives this file a new name
     * @param newName the new name for the file
     */
    async rename(newName: string) {
        const oldName = this.fileName;
        const url = '/repository/rename/' + oldName + '?newName=' + newName;
        const type = 'put';

        const response = await $ajax({ url, type }).catch((error: AjaxError) => { throw new Error('We could not rename the file: ' + error.message) });
        this.hasBeenSavedJustNow = true;
        this.fileName = newName;
        this.repository.updateMetadata(response.data);
        this.hasBeenSavedJustNow = false;
        // Also print a timestampe of the new last modified information
        const lmDate = new Date(this.lastModified);
        const HHmmss = lmDate.toTimeString().substring(0, 8);
        const millis = ('000' + lmDate.getMilliseconds()).substr(-3);

        console.log(`Renamed ${oldName} to ${newName} at ${HHmmss}:${millis}`);
        return this;
    }

    /**
     * Delete the file
     */
    async delete() {
        const url = '/repository/delete/' + this.fileName;
        const type = 'delete';
        const response = await $ajax({ url, type });
        Util.removeFromArray(this.repository.list, this);
        this.repository.updateMetadata(response.data);
        console.log('Deleted ' + this.fileName);
    }

    /**
     * Loads the references and calls back with the reference, to the type the caller of this function expects
     */
    async loadReference<X extends ModelDefinition>(fileName: string): Promise<ServerFile<X>> {
        console.log("Loading reference " + fileName)
        return this.references.load(fileName);
    }

    /**
     * Return a list of files that use this file.
     */
    usedBy() {
        return Util.removeDuplicates(this.repository.list.filter(file => file.references.contains(this)));
    }
}
