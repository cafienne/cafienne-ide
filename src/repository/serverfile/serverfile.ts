import $ajax, { AjaxError } from "@util/ajax";
import Util from "@util/util";
import XML from "@util/xml";
import ModelDefinition from "../definition/modeldefinition";
import RepositoryBase from "../repositorybase";
import Metadata from "./metadata";
export default class ServerFile<M extends ModelDefinition> {
    private _fileName: any;
    private _source: any;
    private _definition?: M;
    private _xml?: Element;
    private static count = 0;
    private instance: number; // Specific for debugging purposes

    fileType: string;
    name: string;
    metadata: Metadata;
    lastModified: string = '';
    hasBeenSavedJustNow: boolean = false;
    clearing: boolean = false;
    parsing: boolean = false;

    /**
     * Creates a new local reference of the server file, based on the json structure given
     * by the server (serverData).
     * When created the reference does not yet hold the content. This can be loaded on 
     * demand through the load method, which can be invoked with a callback.
     */
    constructor(public repository: RepositoryBase, fileName: string, source: any) {
        this.instance = ServerFile.count++;
        this.repository = repository;
        this.name = ''; // Will be filled when the file name is set - which is also done after succesful rename actions
        this.fileType = ''; // Will be filled when the file name is set
        this.fileName = fileName;
        this.source = source;
        this.metadata = new Metadata({ fileName, type: this.fileType, usage: [] }); // Passing proper default values for the metadata (instead of empty)
        this.repository.addFile(this);
        if (source) {
            this.parse();
        }
    }

    /**
     * Note: this method is private/protected
     */
    createModelDefinition(): M {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    get file_identifier(): string {
        return `${this.instance}_${this.fileName}_${this.constructor.name}`;
    }

    toString() {
        // return this.file_identifier; // This is the full instance information, can be used to detect duplicate creations
        return this.fileName;
    }

    get fileName() {
        return this._fileName;
    }

    /**
     * @param fileName
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
    refreshMetadata(serverMetadata: Metadata, isReloading: boolean) {
        this.metadata = serverMetadata;
        if (this.lastModified === serverMetadata.lastModified || this.hasBeenSavedJustNow) {
            // still the same contents, but potentially a new lastmodified timestamp
            // console.log("Data of "+this.fileName+" has not changed on the server-side");
            if (this.lastModified !== serverMetadata.lastModified) {
                // console.log("Updating timestamp of "+this.fileName+" from "+new Date(this.lastModified)+" to "+new Date(serverMetadata.lastModified));
                this.lastModified = serverMetadata.lastModified;
            }
        } else {
            if (isReloading) console.log("Clearing contents of " + this.fileName + ", since server indicates there is new content")
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
            // console.log("Setting source of " + this.fileName)
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
        const references = this.references;
        console.groupCollapsed(`Clearing the contents of ${this.fileName} and ${this.references.length} referenced files`);
        this.clearing = true;
        this.source = undefined;
        this._definition = undefined;
        references.forEach(file => file.clear());
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
        this.parse();
        console.log(`Parse ${this.fileName} is done`);
        return this;
    }

    /**
     * Parse the document and "then" callback
     */
    parse(): ServerFile<M> {
        if (!this.source) {
            console.warn(this.fileName + ": no source content to parse")
            return this;
        }
        if (!this.xml) {
            // There is no xml definition available to parse ...
            if (this.metadata) this.metadata.error = 'This file does not contain a valid XML document to parse';
            return this;
        }
        if (this.parsing) {
            // Avoid recursive parsing.
            return this;
        }
        this.parsing = true;
        this._definition = this.createModelDefinition().initialize();
        // Note: here we should somehow go through the list of ExternalReferences of other models that are using a former definition of us and tell them to update
        // this.usage.forEach(file => {
        //     console.log(this.fileName + ": should be updating the file " + file.fileName +" because we have a new definition")
        // })
        this.validateDefinition();
        this.parsing = false;
        return this;
    }

    /**
     * Callback when a model is parsed and found to have a migrated definition.
     */
    async saveMigratedDefinition() {
        if (this.definition && this.definition.hasMigrated()) {
            console.log(`${this.definition.constructor.name} of '${this.fileName}' has migrated; uploading result`);
            this.source = this.definition.toXML();
            await this.save();
        } else {
            console.warn('Should not be calling this method');
        }
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
            this.parse();
        }
        return this;
    }

    /**
     * Clear the contents of the file and load it again from the server.
     */
    async reload() {
        this.clear();
        await this.repository.listModels();
    }

    /**
     * Uploads the XML content to the server, and invokes the callback after it.
     * Uploading to server gives also a new file list back, which we use to update the repository contents.
     */
    async save() {
        const xmlString = XML.prettyPrint(this.source);
        const url = '/repository/save/' + this.fileName;
        const type = 'post';
        console.groupCollapsed('Saving ' + this);
        const response = await $ajax({ url, data: xmlString, type, headers: { 'content-type': 'application/xml' } }).catch(() => {
            console.groupEnd();
            throw 'We could not save your work due to an error in the server. Please refresh the browser and make sure the server is up and running';
        });
        this.hasBeenSavedJustNow = true;
        await this.repository.updateMetadata(response.data);
        this.hasBeenSavedJustNow = false;
        // Also print a timestampe of the new last modified information
        const lmDate = new Date(this.lastModified);
        const HHmmss = lmDate.toTimeString().substring(0, 8);
        const millis = ('000' + lmDate.getMilliseconds()).substr(-3);
        console.log('Uploaded ' + this + ' at ' + HHmmss + ':' + millis);
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
        await this.repository.updateMetadata(response.data);
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
        this.repository.removeFile(this);
        await this.repository.updateMetadata(response.data);
        console.log('Deleted ' + this.fileName);
    }

    /**
     * @returns A list of files that are used by this file
     */
    get references(): ServerFile<ModelDefinition>[] {
        if (this.definition) {
            return <ServerFile<ModelDefinition>[]>Util.removeDuplicates(this.definition.elements.map(element => element.externalReferences.all).flat().map(ref => ref.file).filter(file => file !== undefined));
        } else {
            return [];
        }
    }

    /**
     * Return a list of files that use this file.
     *  @returns Array with ServerFile's of the files where this file is used in 
     */
    get usage(): ServerFile<ModelDefinition>[] {
        return Util.removeDuplicates(this.repository.list.filter(file => file.references.find(reference => reference === this)));
    }
}
