import Util from "../util/util";
import Content from "./content";

export default class ServerFile {
    /**
     * Creates a new local reference of the server file, based on the json structure given
     * by the server (serverData).
     * When created the reference does not yet hold the content. This can be loaded on 
     * demand through the load method, which can be invoked with a callback.
     * @param {Repository} repository 
     * @param {String} fileName 
     * @param {*} source
     */
    constructor(repository, fileName, source) {
        this.repository = repository;
        this.fileName = fileName;
        this.references = new ServerFileReferences(this);
        this.content = new Content(this);
        this.source = source;
    }

    /**
     * Note: this method is private/protected
     *  @returns {ModelDefinition}
     */
    createModelDefinition() {
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
     * @param {Metadata} serverMetadata 
     */
    refreshMetadata(serverMetadata) {
        this.metadata = serverMetadata;
        if (this.lastModified === serverMetadata.lastModified || this.hasBeenSavedJustNow) {
            // still the same contents, but potentially a new lastmodified timestamp
            // console.log("Data of "+this.fileName+" has not changed on the server-side");
            if (this.lastModified !== serverMetadata.lastModified) {
                // console.log("Updating timestamp of "+this.fileName+" from "+new Date(this.lastModified)+" to "+new Date(serverMetadata.lastModified));
                this.lastModified = serverMetadata.lastModified;
            }
        } else {
            this.clear();
        }
        if (serverMetadata.serverContent) {
            this.source = serverMetadata.serverContent;
        }
        this.lastModified = serverMetadata.lastModified;
    }

    get source() {
        return this.content.source;
    }

    set source(source) {
        this.content.source = source;
    }

    /** @returns {ModelDefinition} */
    get definition() {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    /**
     * Simple method that logs in the console where all this file is used according to the server side repository.
     * 
     */
    get usage() {
        return this.metadata.usage;
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
        this.references.clear();
        this.clearing = false;
        console.groupEnd();
    }

    /**
     * Loads the data of file, and invokes the callback there-after.
     * @param {Followup} then
     */
    fetch(then) {
        if (this.source) {
            then.next(this);
            return;
        }

        const url = '/repository/load/' + this.fileName;
        const type = 'get';
        console.log('Loading ' + url);

        // Simple method for easy checking whether the functionality is still working ...
        // this.usage();

        $.ajax({
            url, type,
            success: (data, status, xhr) => {
                if (xhr.responseText == '') {
                    const msg = this.fileName + ' does not exist or is an empty file in the repository';
                    console.warn(msg);
                } else {
                    this.source = data;
                    // console.log(`Parsing ${this.fileName} during fetch`)
                    this.parse(then);
                }
            },
            error: (xhr, error, eThrown) => {
                console.warn('Could not open ' + url, eThrown)
                // Cut the error message short.
                const str = ('' + eThrown).split('\n')[0];
                then.fail(str);
            }
        });
    }

    /**
     * 
     * @param {Followup} then 
     */
    parse(then) {
        // console.groupEnd();
        // console.log("Parsing " + this.fileName);
        const file = this;
        const definition = this.createModelDefinition();
        this.content.definition = definition;
        if (!file.content.xml) {
            // There is no xml definition available to parse ...
            this.metadata.error = 'This file does not contain a valid XML document to parse';
            then.run(file);
            return;
        }
        definition.parseDocument();
        definition.validateDocument();
        if (file.definition.hasMigrated()) {
            console.log(`Definition of ${file.definition.constructor.name} '${file.fileName}' has migrated; uploading result`);
            file.source = file.definition.toXML();
            file.save();
        }

        definition.loadDependencies(() => {
            // console.log("File["+file.fileName+"].definition: " + file.definition);
            this.validateDefinition();
            then.run(file);
        });
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
     * @param {Followup} then 
     */
    load(then = Followup.None) {
        this.fetch(andThen(_ => {
            if (!this.definition) {
                // console.log(`Parsing ${this.fileName} upon loading`)
                this.parse(andThen(file => then.run(file)));
            } else {
                then.run(this);
            }
        }));
    }

    /**
     * Clear the contents of the file and load it again from the server.
     * @param {Followup} then
     */
    reload(then = Followup.None) {
        this.clear();
        this.load(then);
    }

    /**
     * Uploads the XML content to the server, and invokes the callback after it.
     * Uploading to server gives also a new file list back, which we use to update the repository contents.
     * @param {Followup} then 
     */
    save(then = Followup.None) {
        if (!this.repository.isExistingModel(this.fileName)) { // temporary hack (i hope). creation should take care of this, instead of saving.
            this.repository.list.push(this);
        }

        const xmlString = XML.prettyPrint(this.source);
        const url = '/repository/save/' + this.fileName;
        const type = 'post';
        $.ajax({
            url, data: xmlString, type,
            headers: { 'content-type': 'application/xml' },
            success: (data, status, xhr) => {
                this.hasBeenSavedJustNow = true;
                this.repository.updateFileList(data, andThen(() => {
                    this.hasBeenSavedJustNow = false;
                    // Also print a timestampe of the new last modified information
                    const lmDate = new Date(this.lastModified);
                    const HHmmss = lmDate.toTimeString().substring(0, 8);
                    const millis = ('000' + lmDate.getMilliseconds()).substr(-3);
                    console.log('Uploaded ' + this.fileName + ' at ' + HHmmss + ':' + millis);

                    then.run(data, status, xhr);
                }));
            },
            error: (xhr, error, eThrown) => {
                const msg = 'We could not save your work due to an error in the server. Please refresh the browser and make sure the server is up and running';
                console.error(msg);
                then.fail(msg);
            }
        });
    }

    /**
     * Gives this file a new name
     * @param {String} newName the new name for the file
     * @param {Followup} then 
     */
    rename(newName, then = Followup.None) {
        const oldName = this.fileName;
        const url = `/repository/rename/${oldName}?newName=${newName}`;
        const type = 'put';
        $.ajax({
            url, type,
            success: (data, status, xhr) => {
                this.hasBeenSavedJustNow = true;
                this.fileName = newName;
                this.repository.updateFileList(data, andThen(() => {
                    this.hasBeenSavedJustNow = false;
                    // Also print a timestampe of the new last modified information
                    const lmDate = new Date(this.lastModified);
                    const HHmmss = lmDate.toTimeString().substring(0, 8);
                    const millis = ('000' + lmDate.getMilliseconds()).substr(-3);

                    console.log(`Renamed ${oldName} to ${newName} at ${HHmmss}:${millis}`);
                    then.run(data, status, xhr);
                }));
            },
            error: (xhr, error, eThrown) => {
                then.fail('We could not rename the file: ' + error);
            }
        });
    }

    /**
     * Delete the file
     * @param {Followup} then 
     */
    delete(then = Followup.None) {
        const url = '/repository/delete/' + this.fileName;
        const type = 'delete';
        $.ajax({
            url, type,
            success: (data, status, xhr) => {
                Util.removeFromArray(this.repository.list, this);
                this.repository.updateFileList(data, andThen(() => {
                    console.log('Deleted ' + this.fileName);
                    then.run(data, status, xhr);
                }));
            },
            error: (xhr, error, eThrown) => {
                then.fail('Failure while deleting file ' + this.fileName + ': ' + error);
            }
        });
    }

    /**
     * 
     * @param {String} fileName 
     * @param {(file: ServerFile|undefined) => void} callback
     */
    loadReference(fileName, callback) {
        this.references.load(fileName, callback);
    }

    /**
     * @returns {Array<ServerFile>}
     */
    usedBy() {
        return Util.removeDuplicates(this.repository.list.filter(file => file.references.contains(this)));
    }
}

class ServerFileReferences {
    /**
     * 
     * @param {ServerFile} file 
     */
    constructor(file) {
        this.source = file;
        /** @type {Array<ServerFile>} */
        this.files = [];
    }

    get size() {
        return this.files.length;
    }

    clear() {
        this.files.forEach(file => file.clear());
        Util.clearArray(this.files);
    }

    /**
     * @returns {Array<ServerFile>}
     */
    get all() {
        const set = new Array();
        this.files.forEach(file => {
            set.push(file);
            file.references.all.forEach(reference => set.push(reference))
        });
        return Util.removeDuplicates(set);
    }

    contains(file) {
        return this.all.find(reference => reference === file) !== undefined;
    }

    /**
     * 
     * @param {String} fileName 
     * @param {(file: ServerFile|undefined) => void} callback
     * @returns 
     */
    load(fileName, callback) {
        const file = this.files.find(file => file.fileName === fileName);
        if (file) {
            // console.log(this.source.fileName + " requested " + fileName + " and it is already in our list, with definition: " + file.definition)
            callback(file);
        } else {
            // console.log(this.source.fileName + " requested " + fileName + " and need to load it")
            this.source.repository.load(fileName, andThen(file => {
                if (file) {
                    // console.log(this.source.fileName + " requested " + fileName + " and loaded it, with definition " + file.definition)
                    this.files.push(file);
                }
                callback(file);
            }));
        }
    }
}
