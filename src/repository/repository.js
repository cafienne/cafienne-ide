import Followup from "../util/promise/followup";
import FollowupList from "../util/promise/followuplist";
import Metadata from "./metadata";
import ServerFile from "./serverfile";
import CaseFile from "./serverfile/casefile";
import CFIDFile from "./serverfile/cfidfile";
import DimensionsFile from "./serverfile/dimensionsfile";
import HumanTaskFile from "./serverfile/humantaskfile";
import ProcessFile from "./serverfile/processfile";

export default class Repository {
    /**
     * This object handles the interaction with the backend to load and save the various types of models.
     * It keeps a local copy of all models present in the server. This local copy is updated after each
     * save operation, since the save operation returns a list of all files in the server, along with
     * their last modified status.
     */
    constructor() {
        /** @type {Array<ServerFile>} */
        this.list = [];
        /** @type {Array<Function>} */
        this.listeners = [];
    }

    /**
     * Create a client side represenatation for the file on the server with the specified name.
     * Parses the extension of the file and uses that to create a client side object that can also parse the source of the file.
     * @param {String} fileName 
     * @param {*} source 
     * @returns 
     */
    create(fileName, source) {
        // Split:  divide "myMap/myMod.el.case" into ["MyMap/myMod", "el", "case"]
        const fileType = fileName.split('.').pop();
        switch (fileType) {
            case 'case': return this.createCaseFile(fileName, source);
            case 'dimensions': return this.createDimensionsFile(fileName, source);
            case 'process': return this.createProcessFile(fileName, source);
            case 'humantask': return this.createHumanTaskFile(fileName, source);
            case 'cfid': return this.createCFIDFile(fileName, source);
            default: {
                console.warn(`Extension '${fileType}' is not supported on the client for file ${fileName}`);
                return undefined;
            }
        }
    }

    /**
     * Returns the list of case models in the repository
     * @returns {Array<CaseFile>}
     */
    getCases() {
        return /** @type {Array<CaseFile>} */ (this.list.filter(serverFile => serverFile instanceof CaseFile));
    }

    /**
     * Create a new CaseFile that can parse and write server side .case files
     * @param {String} fileName 
     * @param {*} source 
     * @returns {CaseFile}
     */
    createCaseFile(fileName, source) {
        return new CaseFile(this, fileName, source);
    }

    /**
     * Returns the list of case models in the repository
     * @returns {Array<DimensionsFile>}
     */
    getDimensions() {
        return /** @type {Array<DimensionsFile>} */ (this.list.filter(serverFile => serverFile instanceof DimensionsFile));
    }

    /**
     * Create a new DimensionsFile that can parse and write server side .dimension files
     * @param {String} fileName 
     * @param {*} source 
     * @returns {DimensionsFile}
     */
    createDimensionsFile(fileName, source) {
        return new DimensionsFile(this, fileName, source);
    }

    /**
     * Returns the list of process implementations in the repository
     * @returns {Array<ProcessFile>}
     */
    getProcesses() {
        return /** @type {Array<ProcessFile>} */ (this.list.filter(serverFile => serverFile instanceof ProcessFile));
    }

    /**
     * Create a new ProcessFile that can parse and write server side .process files
     * @param {String} fileName 
     * @param {*} source 
     * @returns {ProcessFile}
     */
    createProcessFile(fileName, source) {
        return new ProcessFile(this, fileName, source);
    }

    /**
     * Returns the list of human task implementations in the repository
     * @returns {Array<HumanTaskFile>}
     */
    getHumanTasks() {
        return /** @type {Array<HumanTaskFile>} */ (this.list.filter(serverFile => serverFile instanceof HumanTaskFile));
    }

    /**
     * Create a new HumanTaskFile that can parse and write server side .humantask files
     * @param {String} fileName 
     * @param {*} source 
     * @returns {HumanTaskFile}
     */
    createHumanTaskFile(fileName, source) {
        return new HumanTaskFile(this, fileName, source);
    }

    /**
     * Returns the list of case file item definitions in the repository
     * @returns {Array<CFIDFile>}
     */
    getCaseFileItemDefinitions() {
        return /** @type {Array<CFIDFile>} */ (this.list.filter(serverFile => serverFile instanceof CFIDFile));
    }

    /**
     * Create a new CFIDFile that can parse and write server side .cfid files
     * @param {String} fileName 
     * @param {*} source 
     * @returns {CFIDFile}
     */
    createCFIDFile(fileName, source) {
        return new CFIDFile(this, fileName, source);
    }

    /**
     * Registers a listener that is invoked each time
     * the list of models in the repository is updated.
     * @param {Function} listener 
     */
    onListRefresh(listener) {
        this.listeners.push(listener);
    }

    /**
     * Invokes the backend to return a new copy of the list of models.
     * @param {Followup} then Optional callback that will be invoked after model list has been retrieved
     */
    listModels(then = Followup.None) {
        $.ajax({
            url: '/repository/list',
            type: 'get',
            success: (data, status, xhr) => {
                this.updateFileList(data.map(item => new Metadata(item)), then);
            },
            error: (xhr, error, eThrown) => {
                console.error('Could not list the repository contents', eThrown);
                then.fail('Could not fetch the list of models: ' + error);
            }
        });
    }

    /**
     * Returns true if a model with the given name exists in the repository.
     * @param {String} fileName 
     */
    isExistingModel(fileName) {
        return this.list.find(model => model.fileName === fileName) !== undefined;
    }

    /**
     * Clears content for the model
     * @param {String} fileName 
     */
    clear(fileName) {
        if (this.isExistingModel(fileName)) {
            this.list.find(model => model.fileName === fileName).clear();
        }
    }

    /**
     * Updates the cache with the most recent 'lastModified' information from the server.
     * This includes a full list of the filenames of all models in the server, as well as the lastModified timestamp
     * of each file in the server. Based on this, the locally cached contents is removed if it is stale.
     * @param {Array<Metadata>} newServerFileList
     * @param {Followup} then
     */
    updateFileList(newServerFileList, then = Followup.None) {
        console.groupCollapsed("Loading repository contents");
        // Make a copy of the old list, to be able to clean up old models afterwards;
        const oldList = this.list;

        const todo = new FollowupList(andThen(() => {
            // After refreshing and parsing, invoke any repository listeners about the new list.
            this.listeners.forEach(listener => listener());
            console.groupEnd();
            then.run();
        }));

        // Map the new server list into a list of structured objects. Also re-use existing objects as much as possible.
        /** @type {Array<ServerFile>} */
        this.list = newServerFileList.map(fileMetadata => {
            const fileName = fileMetadata.fileName;
            const existingServerFile = oldList.find(file => file.fileName == fileName);
            if (!existingServerFile) {
                const newFile = this.create(fileName);
                if (newFile) {
                    newFile.refreshMetadata(fileMetadata);
                    return newFile;    
                }
            } else {
                Util.removeFromArray(oldList, existingServerFile);
                existingServerFile.refreshMetadata(fileMetadata);
                return existingServerFile;
            }
        }).filter(file => file !== undefined);
        // Inform elements still in old list about their deletion.
        oldList.forEach(serverFile => serverFile.deprecate());

        // Now parse all files in the list
        todo.run(this.list.sort((f1, f2) => f2 instanceof CaseFile ? 1 : -1).map(file => (callback => {
            if (file.definition) callback();
            else {
                // console.log("Starting parse of " + file.fileName)
                file.parse(andThen(() => {
                    // console.log("Completed parsing " + file.fileName)
                    callback();
                }));
            }
        })));
    }

    /**
     * Save xml file and upload to server
     * @param {String} fileName 
     * @param {Document | String} xml 
     * @param {Followup} then 
     */
    saveXMLFile(fileName, xml, then = Followup.None) {
        if (!this.isExistingModel(fileName)) { // temporary hack (i hope). creation should take care of this, instead of saving.
            this.list.push(this.create(fileName));
        }
        const serverFile = this.list.find(serverFile => serverFile.fileName === fileName);
        const data = xml instanceof String ? xml : XML.prettyPrint(xml);
        serverFile.source = data;
        serverFile.save(then);
    }

    /**
     * Rename file and update all references to file on server and invokes the callback on succesfull completion
     * @param {String} fileName
     * @param {String} newFileName
     * @param {Followup} then 
     */
    rename(fileName, newFileName, then = Followup.None) {
        newFileName = newFileName.split(' ').join('');
        const serverFile = this.get(fileName);
        if (!serverFile) {
            console.log(`Cannot rename ${fileName} to ${newFileName} as the file is not available on the front end`);
        } else if (fileName === newFileName) {
            console.log(`Renaming ${fileName} to ${newFileName} requested, but new name is the same as the current name`);
        } else if (this.get(newFileName)) {
            console.log(`Cannot rename ${fileName} to ${newFileName} as that name already exists`);
        } else {
            console.log(`Renaming '${fileName}' to '${newFileName}'`);
            serverFile.rename(newFileName, then);
        }
    }

    /**
     * Delete file and invokes the callback on succesfull completion
     * @param {String} fileName
     * @param {Followup} andThen 
     */
    delete(fileName, andThen = Followup.None) {
        console.log(`Requesting to delete [${fileName}]`);
        const serverFile = this.get(fileName);
        if (!serverFile) {
            console.log(`Cannot delete ${fileName} as the file is not available on the front end`);
        } else {
            //TODO: Check for usage in other models
            console.log(`Deleting ${fileName}`)
            serverFile.delete(andThen);
        }
    }

    get(fileName) {
        return this.list.find(serverFile => serverFile.fileName === fileName);
    }

    /**
     * Loads the file from the repository and invokes the callback on successful completion.
     * If the file does not exist, it will invoke the callback with undefined.
     * 
     * @param {String} fileName 
     * @param {Followup} then 
     */
    load(fileName, then) {
        const serverFile = this.get(fileName);
        if (serverFile) {
            serverFile.load(then);
        } else {
            console.warn(`File ${fileName} does not exist and cannot be loaded`);
            then.run(undefined);
        }
    }
}
