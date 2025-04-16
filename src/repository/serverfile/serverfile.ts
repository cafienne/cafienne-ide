import Util from "../../util/util";
import XML, { Document, Element } from "../../util/xml";
import ModelDefinition from "../definition/modeldefinition";
import Repository from "../repository";
import Metadata from "./metadata";

abstract class ServerFile<M extends ModelDefinition> {
    private _fileName: any;
    private _source: any;
    private _definition?: M;
    private _xml?: Element;
    private _document?: Document;
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
    constructor(public repository: Repository, fileName: string, source: any) {
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
    abstract createModelDefinition(): M;

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
        if (serverMetadata.content) {
            this.source = serverMetadata.content;
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
            this._document = XML.parseXML(source);
            this._xml = this._document ? this._document.documentElement ?? undefined : undefined;
        }
    }

    get definition(): M | undefined {
        return this._definition;
    }

    /**
     */
    get xml(): Element | undefined {
        return this._xml;
    }

    get xmlDocument(): Document | undefined {
        return this._document;
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

        this.source = await this.repository.storage.loadModel(this.fileName);
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
    async save(): Promise<void> {
        console.groupCollapsed('Saving ' + this.fileName);
        const newMetadata = await this.repository.storage.saveModel(this.fileName, this.source);
        this.hasBeenSavedJustNow = true;
        await this.repository.updateMetadata(newMetadata);
        this.hasBeenSavedJustNow = false;
        // Also print a timestampe of the new last modified information
        const lmDate = new Date(this.lastModified);
        const HHmmss = lmDate.toTimeString().substring(0, 8);
        const millis = ('000' + lmDate.getMilliseconds()).substr(-3);
        console.log('Uploaded ' + this + ' at ' + HHmmss + ':' + millis);
        console.groupEnd();
    }

    protected isRenaming = false;

    /**
     * Gives this file a new name
     * @param newFileName the new name for the file
     */
    async rename(newFileName: string) {
        if (this.isRenaming) {
            console.warn(`Already renaming ${this.fileName}`);
            return;
        }
        this.isRenaming = true;
        newFileName = newFileName.split(' ').join('');
        const oldFileName = this.fileName;
        if (oldFileName === newFileName) {
            console.log(`Renaming ${oldFileName} to ${newFileName} requested, but new name is the same as the current name`);
        } else if (this.repository.hasFile(newFileName)) {
            console.log(`Cannot rename ${oldFileName} to ${newFileName} as that name already exists`);
        }

        if (this.definition && this.definition.id === oldFileName) {
            this.definition.id = newFileName;
            if (this.definition.name === this.name) {
                this.definition.name = newFileName.substring(0, newFileName.length - this.fileType.length - 1);
            }
        }

        const newMetadata = await this.repository.storage.renameModel(oldFileName, newFileName, this.definition?.toXML());
        this.hasBeenSavedJustNow = true;
        this.fileName = newFileName;
        await this.repository.updateMetadata(newMetadata);
        this.hasBeenSavedJustNow = false;
        const filesToBeSaved = this.usage;
        console.log(`Updating ${filesToBeSaved.length} files that have references to ${oldFileName}`)
        for (let i = 0; i < filesToBeSaved.length; i++) {
            filesToBeSaved[i].source = filesToBeSaved[i].definition?.toXMLString();
            await filesToBeSaved[i].save();
        }
        console.groupEnd();
        this.isRenaming = false;
        return this;
    }

    /**
     * Delete the file
     */
    async delete() {
        const metadata = await this.repository.storage.deleteModel(this.fileName);
        this.repository.removeFile(this);
        await this.repository.updateMetadata(metadata);
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

export default ServerFile;