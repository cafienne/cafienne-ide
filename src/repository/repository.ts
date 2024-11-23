import Util from "../util/util";
import ModelDefinition from "./definition/modeldefinition";
import Definitions from "./deploy/definitions";
import CaseFile from "./serverfile/casefile";
import CFIDFile from "./serverfile/cfidfile";
import DimensionsFile from "./serverfile/dimensionsfile";
import HumanTaskFile from "./serverfile/humantaskfile";
import Metadata from "./serverfile/metadata";
import ProcessFile from "./serverfile/processfile";
import ServerFile from "./serverfile/serverfile";
import CaseTeamFile from "./serverfile/caseteamfile";
import TypeFile from "./serverfile/typefile";
import FileStorage from "./storage/filestorage";

export default class Repository {
    public readonly list: Array<ServerFile<ModelDefinition>> = [];
    listeners: (() => void)[] = [];

    /**
     * This object handles the interaction with the backend to load and save the various types of models.
     * It keeps a local copy of all models present in the server. This local copy is updated after each
     * save operation, since the save operation returns a list of all files in the server, along with
     * their last modified status.
     */
    constructor(public storage: FileStorage) {
    }

    /**
     * Create a client side representation for the file on the server with the specified name.
     * Parses the extension of the file and uses that to create a client side object that can also parse the source of the file.
     */
    private create(fileName: string, source?: any): ServerFile<ModelDefinition> | undefined {
        // Split:  divide "myMap/myMod.el.case" into ["MyMap/myMod", "el", "case"]
        const fileType = fileName.split('.').pop();
        switch (fileType) {
            case 'case': return this.createCaseFile(fileName, source);
            case 'dimensions': return this.createDimensionsFile(fileName, source);
            case 'process': return this.createProcessFile(fileName, source);
            case 'humantask': return this.createHumanTaskFile(fileName, source);
            case 'cfid': return this.createCFIDFile(fileName, source);
            case 'type': return this.createTypeFile(fileName, source);
            case 'caseteam': return this.createCaseTeamFile(fileName, source);
            default: {
                console.warn(`Extension '${fileType}' is not supported on the client for file ${fileName}`);
                return undefined;
            }
        }
    }

    /**
     * Returns the list of case models in the repository
     */
    getCases(): CaseFile[] {
        return <CaseFile[]>this.list.filter(serverFile => serverFile instanceof CaseFile);
    }

    /**
     * Create a new CaseFile that can parse and write server side .case files
     */
    createCaseFile(fileName: string, source: any): CaseFile {
        return new CaseFile(this, fileName, source);
    }

    /**
     * Returns the list of case models in the repository
     */
    getDimensions(): DimensionsFile[] {
        return <DimensionsFile[]>this.list.filter(serverFile => serverFile instanceof DimensionsFile);
    }

    /**
     * Create a new DimensionsFile that can parse and write server side .dimension files
     */
    createDimensionsFile(fileName: string, source: any): DimensionsFile {
        return new DimensionsFile(this, fileName, source);
    }

    /**
     * Returns the list of process implementations in the repository
     */
    getProcesses(): ProcessFile[] {
        return <ProcessFile[]>this.list.filter(serverFile => serverFile instanceof ProcessFile);
    }

    /**
     * Create a new ProcessFile that can parse and write server side .process files
     */
    createProcessFile(fileName: string, source: any): ProcessFile {
        return new ProcessFile(this, fileName, source);
    }

    /**
     * Returns the list of human task implementations in the repository
     */
    getHumanTasks(): HumanTaskFile[] {
        return this.list.filter(serverFile => serverFile instanceof HumanTaskFile);
    }

    /**
     * Create a new HumanTaskFile that can parse and write server side .humantask files
     */
    createHumanTaskFile(fileName: string, source: any): HumanTaskFile {
        return new HumanTaskFile(this, fileName, source);
    }

    /**
     * Returns the list of case file item definitions in the repository
     */
    getCaseFileItemDefinitions(): CFIDFile[] {
        return <CFIDFile[]>this.list.filter(serverFile => serverFile instanceof CFIDFile);
    }

    /**
     * Create a new CFIDFile that can parse and write server side .cfid files
     */
    createCFIDFile(fileName: string, source: any): CFIDFile {
        return new CFIDFile(this, fileName, source);
    }

    /**
     * Returns the list of types in the repository
     */
    getTypes(): TypeFile[] {
        return <TypeFile[]>this.list.filter(serverFile => serverFile instanceof TypeFile);
    }

    /**
     * Create a new TypeFile that can parse and write server side .type files
     */
    createTypeFile(fileName: string, source: any): TypeFile {
        return new TypeFile(this, fileName, source);
    }

    getCaseTeams() {
        return <CaseTeamFile[]>this.list.filter(serverFile => serverFile instanceof CaseTeamFile);
    }

    createCaseTeamFile(fileName: string, source: any) {
        return new CaseTeamFile(this, fileName, source);
    }

    /**
     * Registers a listener that is invoked each time
     * the list of models in the repository is updated.
     */
    onListRefresh(listener: () => void): void {
        this.listeners.push(listener);
    }

    removeListRefreshCallback(listener: Function): void {
        Util.removeFromArray(this.listeners, listener);
    }

    /**
     * Invokes the backend to return a new copy of the list of models.
     * Optional callback that will be invoked after model list has been retrieved
     */
    async listModels(): Promise<void> {
        try {
            const files = await this.storage.listModels();
            await this.updateFileList(files.map(Metadata.from));
        } catch (error: any) {
            console.error(error); // Actually also other errors may occur, therefore also logging the stacktrace
            throw 'Could not fetch the list of models: ' + error.toString();
        };
    }

    /**
     * @param file a ServerFile instance or a file name
     * @returns true if the file already exists, or if a file with the same name and of the same type already exists in the repository list
     */
    hasFile<F extends ServerFile<ModelDefinition>>(file: F | string, ignoreCase: boolean = false): boolean {
        if (typeof (file) === 'string') {
            return this.list.find(model => model.fileName === file) !== undefined;
        }
        if (this.list.indexOf(file) >= 0) {
            return true;
        }
        if (this.list.find(existingFile => existingFile.fileName === file.fileName && existingFile.constructor.name === file.constructor.name)) {
            return true;
        }
        return false;
    }

    async updateMetadata(newServerFileList: Array<Metadata>, parseFiles = false): Promise<void> {
        const isReloading = this.list.length > 0;
        const logMessage = parseFiles ? 'Loading repository contents' : 'Updating repository metadata';
        console.groupCollapsed(logMessage);
        // Find out which files are no longer existing and clean them
        this.list.filter(file => {
            const metadata = newServerFileList.find(m => m.fileName === file.fileName);
            // A file is old if the server does not know it, AND if it was previously known (derived from the fact that we have a value for metadata.lastModified)
            if (metadata === undefined && file.metadata.lastModified !== undefined) {
                this.removeFile(file);
                // Inform elements still in old list about their deletion
                file.deprecate();
            }
        });

        // Iterate the data from the server and update existing or create new ServerFile instances. 
        newServerFileList.forEach(fileMetadata => {
            const fileName = fileMetadata.fileName;
            const existingServerFile = this.list.find(file => file.fileName === fileName);
            if (!existingServerFile) {
                const newFile = this.create(fileName);
                if (newFile) { // Would be weird if not created, but ok.
                    newFile.refreshMetadata(fileMetadata, isReloading);
                }
            } else {
                existingServerFile.refreshMetadata(fileMetadata, isReloading);
            }
        });

        // Now parse all files in the list, starting with the cases
        const filesToParse = this.list.sort((f1, f2) => f2 instanceof CaseFile ? 1 : -1);
        for (let i = 0; i < filesToParse.length; i++) {
            const file = filesToParse[i];
            if (!file.definition) {
                file.parse();
            }
        }

        const migratedFiles = this.list.filter(file => file.definition && file.definition.hasMigrated());
        if (migratedFiles.length > 0) {
            console.groupCollapsed(`Saving ${migratedFiles.length} migrated definitions`);
            for (let i = 0; i < migratedFiles.length; i++) {
                await migratedFiles[i].saveMigratedDefinition();
            }
            console.groupEnd();
        }

        // Sort the list in alphabetical order
        this.list.sort((f1, f2) => f1.fileName.toLowerCase().localeCompare(f2.fileName.toLowerCase()))

        // Tell the rest of the world
        console.log("Informing " + this.listeners.length + " listeners about the new metadata")
        this.listeners.forEach(listener => listener());
        console.groupEnd();
    }

    /**
     * Updates the cache with the most recent 'lastModified' information from the server.
     * This includes a full list of the filenames of all models in the server, as well as the lastModified timestamp
     * of each file in the server. Based on this, the locally cached contents is removed if it is stale.
     */
    async updateFileList(newServerFileList: Array<Metadata>): Promise<void> {
        await this.updateMetadata(newServerFileList, true);
    }

    /**
     * Rename file and update all references to file on server and invoke the callback upon successful completion
     */
    async rename(fileName: string, newFileName: string): Promise<ServerFile<ModelDefinition> | undefined> {
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
    async delete(fileName: string): Promise<void> {
        console.log(`Requesting to delete [${fileName}]`);
        const serverFile = this.get(fileName);
        if (!serverFile) {
            console.log(`Cannot delete ${fileName} as the file is not available on the front end`);
        } else {
            //TODO: Check for usage in other models
            console.log(`Deleting ${fileName}`)
            await serverFile.delete();
        }
    }

    get(fileName: string): ServerFile<ModelDefinition> | undefined {
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

    addFile(file: ServerFile<ModelDefinition>): void {
        // if (this.list.find(item => file.fileName === item.fileName)) {
        //     throw new Error("File " + file.fileName + " already exists")
        // }
        // console.warn("Adding file " + file)
        this.list.push(file);
    }

    removeFile(file: ServerFile<ModelDefinition>): void {
        // console.log("Removing file " + file +" from the repository list");
        Util.removeFromArray(this.list, file);
    }

    getFile(fileName: string): ServerFile<ModelDefinition> | undefined {
        return this.list.find(file => file.fileName === fileName);
    }

    async deploy(definitions: Definitions) {
        this.storage.deploy(definitions.fileName, definitions.contents());
    }
}
