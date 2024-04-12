class ServerFile {
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
        this.ide = this.repository.ide;
        this.fileName = fileName;
        this.references = new ServerFileReferences(this);
        this.content = new Content(this);
        this.source = source;
    }

    /**
     * Returns true if this server file has a model editor that can render it
     * @returns {boolean}
     */
    get hasModelEditor() {
        return false;
    }

    /**
     * Note: this method is private/protected
     *  @returns {ModelDefinition}
     */
    createDefinition() {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    /**
     * Note: this method is private/protected
     * @returns {ModelEditor}
     */
    createEditor() {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    loadEditor() {
        this.loading = true;
        this.load(() => {
            console.groupCollapsed(`Creating editor for ${this.fileName}`);
            this.editor = this.createEditor();
            console.groupEnd();
            console.groupCollapsed(`Loading model ${this.fileName} in editor`);
            this.editor.loadModel();
            console.groupEnd();
        });
    }

    reloadEditor() {
        console.groupCollapsed(`Reloading editor of ${this.fileName}`);
        this.clear();
        this.load(() => {
            console.groupCollapsed("After clearing and loading now asking editor to loadModel " + this.fileName)
            this.editor.loadModel();
            console.groupEnd();
            console.log(`Finished reload editor of ${this.fileName}`);
            console.groupEnd();
        });
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
        if (source === undefined) {
            console.log("Clearing source " + this.fileName)
        }
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
        console.group(`Clearing the contents of ${this.fileName} and ${this.references.size} referenced files`);
        this.clearing = true;
        this.source = undefined;
        this.references.clear();
        console.log("Completed clearing, now having only " + this.references.size + " references")
        this.clearing = false;
        console.groupEnd();
    }

    /**
     * Loads the data of file, and invokes the callback there-after.
     * @param {Function} callback 
     */
    fetch(callback) {
        if (this.source) {
            callback(this);
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
                    this.ide.info(msg);
                } else {
                    this.source = data;
                    console.log(`Parsing ${this.fileName} during fetch`)
                    this.parse(() => callback(this));
                }
            },
            error: (xhr, error, eThrown) => {
                console.warn('Could not open ' + url, eThrown)
                // Cut the error message short.
                const str = ('' + eThrown).split('\n')[0];
                this.ide.danger('Could not read file ' + this.fileName + ' due to an error:<div>' + str + '</div>');
            }
        });
    }

    parse(callback) {
        const file = this;
        const definition = this.createDefinition();
        this.content.definition = definition;
        definition.parseDocument();
        definition.validateDocument();
        if (file.definition.hasMigrated()) {
            console.log(`Definition of ${file.definition.constructor.name} '${file.fileName}' has migrated; uploading result`);
            file.source = file.definition.toXML();
            file.save();
        }

        console.groupCollapsed("Loading dependencies of " + this.fileName);
        definition.loadDependencies(() => {
            console.groupEnd();
            callback()
        });
    }

    /**
     * 
     * @param {(file: ServerFile) => void} callback 
     */
    load(callback) {
        this.fetch(_ => {
            if (!this.definition) {
                console.log(`Parsing ${this.fileName} upon loading`)
                this.parse(() => callback(this))
            } else {
                callback(this);
            }
        });
    }

    /**
     * Uploads the XML content to the server, and invokes the callback after it.
     * Uploading to server gives also a new file list back, which we use to update the repository contents.
     * @param {Function} callback 
     */
    save(callback = undefined) {
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
                this.repository.updateFileList(data);
                this.hasBeenSavedJustNow = false;
                // Also print a timestampe of the new last modified information
                const lmDate = new Date(this.lastModified);
                const HHmmss = lmDate.toTimeString().substring(0, 8);
                const millis = ('000' + lmDate.getMilliseconds()).substr(-3);
                console.log('Uploaded ' + this.fileName + ' at ' + HHmmss + ':' + millis);

                if (typeof (callback) == 'function') {
                    callback(data, status, xhr);
                }
            },
            error: (xhr, error, eThrown) => {
                this.ide.danger('We could not save your work due to an error in the server. Please refresh the browser and make sure the server is up and running');
            }
        });
    }

    /**
     * Gives this file a new name
     * @param {String} newName the new name for the file
     * @param {Function} callback 
     */
    rename(newName, callback = undefined) {
        const oldName = this.fileName;
        const url = `/repository/rename/${oldName}?newName=${newName}`;
        const type = 'put';
        $.ajax({
            url, type,
            success: (data, status, xhr) => {
                this.hasBeenSavedJustNow = true;
                this.fileName = newName;
                this.repository.updateFileList(data);
                this.hasBeenSavedJustNow = false;
                if (typeof (callback) == 'function') {
                    callback(data, status, xhr);
                } else {
                    // Also print a timestampe of the new last modified information
                    const lmDate = new Date(this.lastModified);
                    const HHmmss = lmDate.toTimeString().substring(0, 8);
                    const millis = ('000' + lmDate.getMilliseconds()).substr(-3);

                    console.log(`Renamed ${oldName} to ${newName} at ${HHmmss}:${millis}`);
                }
            },
            error: (xhr, error, eThrown) => {
                this.ide.danger('We could not rename the file: ' + error);
            }
        });
    }

    /**
     * Delete the file
     * @param {Function} callback 
     */
    delete(callback = undefined) {
        const url = '/repository/delete/' + this.fileName;
        const type = 'delete';
        $.ajax({
            url, type,
            success: (data, status, xhr) => {
                Util.removeFromArray(this.repository.list, this);
                this.repository.updateFileList(data);
                if (typeof (callback) == 'function') {
                    callback(data, status, xhr);
                } else {
                    console.log('Deleted ' + this.fileName);
                }
            },
            error: (xhr, error, eThrown) => {
                this.ide.danger('We could not delete the file: ' + error);
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
}

class ServerFileWithEditor extends ServerFile {
    get hasModelEditor() {
        return true;
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
        this.references = [];
    }

    get size() {
        return this.references.length;
    }

    clear() {
        this.references.forEach(file => file.clear());
        this.references = [];
    }

    /**
     * 
     * @param {String} fileName 
     * @param {(file: ServerFile|undefined) => void} callback
     * @returns 
     */
    load(fileName, callback) {
        const file = this.references.find(file => file.fileName === fileName);
        if (file) {
            callback(file);
        } else {
            this.source.repository.load(fileName, file => {
                if (file) {
                    this.references.push(file);
                }
                callback(file);
            });    
        }
    }
}
