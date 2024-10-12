import Util from "@util/util";
import XML from "@util/xml";
import ModelDefinition from "./definition/modeldefinition";
import RepositoryBase from "./repositorybase";
import CaseFile from "./serverfile/casefile";
import CFIDFile from "./serverfile/cfidfile";
import DimensionsFile from "./serverfile/dimensionsfile";
import HumanTaskFile from "./serverfile/humantaskfile";
import Metadata from "./serverfile/metadata";
import ProcessFile from "./serverfile/processfile";
import ServerFile, { $ajax } from "./serverfile/serverfile";

export default class Repository extends RepositoryBase {
    listeners: (() => void)[] = [];
    /**
     * This object handles the interaction with the backend to load and save the various types of models.
     * It keeps a local copy of all models present in the server. This local copy is updated after each
     * save operation, since the save operation returns a list of all files in the server, along with
     * their last modified status.
     */
    constructor() {
        super();
    }

    /**
     * Create a client side representation for the file on the server with the specified name.
     * Parses the extension of the file and uses that to create a client side object that can also parse the source of the file.
     */
    create(fileName: string, source?: any) {
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
     */
    getCases() {
        return <CaseFile[]>this.list.filter(serverFile => serverFile instanceof CaseFile);
    }

    /**
     * Create a new CaseFile that can parse and write server side .case files
     */
    createCaseFile(fileName: string, source: any) {
        return new CaseFile(this, fileName, source);
    }

    /**
     * Returns the list of case models in the repository
     */
    getDimensions() {
        return <DimensionsFile[]>this.list.filter(serverFile => serverFile instanceof DimensionsFile);
    }

    /**
     * Create a new DimensionsFile that can parse and write server side .dimension files
     */
    createDimensionsFile(fileName: string, source: any) {
        return new DimensionsFile(this, fileName, source);
    }

    /**
     * Returns the list of process implementations in the repository
     */
    getProcesses() {
        return <ProcessFile[]>this.list.filter(serverFile => serverFile instanceof ProcessFile);
    }

    /**
     * Create a new ProcessFile that can parse and write server side .process files
     */
    createProcessFile(fileName: string, source: any) {
        return new ProcessFile(this, fileName, source);
    }

    /**
     * Returns the list of human task implementations in the repository
     */
    getHumanTasks() {
        return this.list.filter(serverFile => serverFile instanceof HumanTaskFile);
    }

    /**
     * Create a new HumanTaskFile that can parse and write server side .humantask files
     */
    createHumanTaskFile(fileName: string, source: any) {
        return new HumanTaskFile(this, fileName, source);
    }

    /**
     * Returns the list of case file item definitions in the repository
     */
    getCaseFileItemDefinitions() {
        return <CFIDFile[]>this.list.filter(serverFile => serverFile instanceof CFIDFile);
    }

    /**
     * Create a new CFIDFile that can parse and write server side .cfid files
     */
    createCFIDFile(fileName: string, source: any) {
        return new CFIDFile(this, fileName, source);
    }

    /**
     * Registers a listener that is invoked each time
     * the list of models in the repository is updated.
     */
    onListRefresh(listener: () => void) {
        this.listeners.push(listener);
    }

    /**
     * Invokes the backend to return a new copy of the list of models.
     * Optional callback that will be invoked after model list has been retrieved
     */
    async listModels() {
        return $ajax({
            url: '/repository/list',
            type: 'get'
        }).then(({ data, status, xhr }) => {
            return this.updateFileList(data.map(Metadata.from)).catch(error => 
                console.log("Issue here ", error)
            );
        }).catch(({ xhr, status, errorThrown }) => {
            console.error('Could not list the repository contents', errorThrown);
            throw 'Could not fetch the list of models: ' + status;
        });
    }

    /**
     * Returns true if a model with the given name exists in the repository.
     */
    isExistingModel(fileName: string) {
        return this.list.find(model => model.fileName === fileName) !== undefined;
    }

    updateMetadata(newServerFileList: Array<Metadata>) {
        console.groupCollapsed("Updating repository metadata");
        // Make a copy of the old list, to be able to clean up old models afterwards;
        const oldList = this.list;
        // Map the new server list into a list of structured objects. Also re-use existing objects as much as possible.
        this.list = newServerFileList.map(fileMetadata => {
            const fileName = fileMetadata.fileName;
            const existingServerFile = oldList.find(file => file.fileName == fileName);
            if (!existingServerFile) {
                const newFile = this.create(fileName);
                console.log("Adding new server file " + fileName);
                if (newFile) {
                    newFile.refreshMetadata(fileMetadata);
                    return newFile;
                }
            } else {
                Util.removeFromArray(oldList, existingServerFile);
                existingServerFile.refreshMetadata(fileMetadata);
                return existingServerFile;
            }
        }).filter(file => file !== undefined) as ServerFile<ModelDefinition>[];
        // Inform elements still in old list about their deletion.
        oldList.forEach(serverFile => serverFile.deprecate());

        console.log("Informing " + this.listeners.length +" listeners about the new metadata")
        this.listeners.forEach(listener => listener());
        console.groupEnd();
    }

    /**
     * Updates the cache with the most recent 'lastModified' information from the server.
     * This includes a full list of the filenames of all models in the server, as well as the lastModified timestamp
     * of each file in the server. Based on this, the locally cached contents is removed if it is stale.
     */
    async updateFileList(newServerFileList: Array<Metadata>): Promise<void> {
        console.groupCollapsed("Loading repository contents");
        this.updateMetadata(newServerFileList);
        // Now parse all files in the list
        const filesToParse = this.list.sort((f1, f2) => f2 instanceof CaseFile ? 1 : -1);
        // console.log("Found " + filesToParse.length +" files to be parsed:\n- ", filesToParse.map(file => file.fileName).join('\n- '))
        for (let i = 0; i<filesToParse.length; i++) {
            const file = filesToParse[i];
            if (! file.definition) {
                // console.log("Starting parse of " + file.fileName)
                await file.parse()//.then(() => console.log("Completed parsing " + file.fileName));
            }
        }
    
        // After refreshing and parsing, invoke any repository listeners about the new list.
        this.listeners.forEach(listener => listener());
        console.groupEnd();
    }

    /**
     * Save xml file and upload to server
     * @deprecated
     */
    async saveXMLFile(fileName: string, xml: Document | string) {
        if (!this.isExistingModel(fileName)) { // temporary hack (i hope). creation should take care of this, instead of saving.
            const file = this.create(fileName);
            if (file) this.list.push(file);
        }
        const serverFile = this.list.find(serverFile => serverFile.fileName === fileName);
        if (serverFile) {
            const data = xml instanceof String ? xml : XML.prettyPrint(xml);
            serverFile.source = data;
            return serverFile.save();
        }
    }

    /**
     * Rename file and update all references to file on server and invoke the callback upon successful completion
     */
    async rename(fileName: string, newFileName: string) {
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
            return serverFile.rename(newFileName);
        }
    }

    /**
     * Delete file and invoke the callback upon successful completion
     */
    async delete(fileName: string) {
        console.log(`Requesting to delete [${fileName}]`);
        const serverFile = this.get(fileName);
        if (!serverFile) {
            console.log(`Cannot delete ${fileName} as the file is not available on the front end`);
        } else {
            //TODO: Check for usage in other models
            console.log(`Deleting ${fileName}`)
            return serverFile.delete();
        }
    }

    get(fileName: string) {
        return this.list.find(serverFile => serverFile.fileName === fileName);
    }

    /**
     * Loads the file from the repository and invoke the callback upon successful completion.
     * If the file does not exist, it will invoke the callback with undefined.
     */
    async load<X extends ModelDefinition>(fileName: string): Promise<ServerFile<X>> {
        const serverFile: ServerFile<X> = <ServerFile<X>>this.get(fileName);
        if (serverFile) {
            return <Promise<ServerFile<X>>>serverFile.load();
        } else {
            console.warn(`File ${fileName} does not exist and cannot be loaded`);
            throw new Error(`File ${fileName} does not exist and cannot be loaded`);
        }
    }
}
