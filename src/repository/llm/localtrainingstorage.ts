import * as fs from "fs/promises";
import * as path from "path";
import RepositoryConfiguration from "../../config/config";
import Metadata from "../serverfile/metadata";
import TrainingStorage from "./trainingstorage";
import { log } from "console";
import { readFile } from "fs";

function isKnownExtension(extension: string): boolean {
    return ['.jsonl', '.json'].indexOf(extension) >= 0;
}

export default class LocalTrainingStorage extends TrainingStorage {

    static logAction = (msg: string): void => { };

    public deployFolder = this.config.deploy;
    public trainingFolder = this.config.training;

    constructor(public config: RepositoryConfiguration) {
        super();
        this.verifyConfiguration();
    }
    

    private async verifyConfiguration(): Promise<void> {
        //  Check if the training folder is a directory. 
        await this.ensureFolderIsNotFile(this.trainingFolder, 'training');
    }

    private async ensureFolderIsNotFile(folder: any, key: string) {
        try {
            const stats = await fs.stat(folder);
            if (!stats.isDirectory()) {
                const msg = `Repository configuration failure for '${key}' setting\n\n "${folder}" is not a directory\n`;
                console.error(msg);
                throw new Error(msg);
            }
        } catch {
            // intentionally left blank, since the folder does not exist
        }
    }

    async renameTrainingForModel(fileName: any, newFileName: string, updatedContent: any): Promise<Metadata[]> {
        const oldPath = makePath(this.trainingFolder, fileName);
        const newPath = makePath(this.trainingFolder, newFileName);
        

        await fs.rename(oldPath, newPath);
        await writeFile(this.trainingFolder, newFileName, updatedContent);

        return await this.fetchMetadata();
    }

    async addSetPointAndSave(fileName: any, source: any, instruction: string): Promise<Metadata[]> {
        //Open file or create it if it does not exist
        //Add training json to file. 
        const fileWithExtension = fileName + '.jsonl';
        const existingContent: string = await this.loadTrainingForModel(fileWithExtension);
        const updatedContent = existingContent.trim() + '\n' + JSON.stringify({ instruction, source });  
        await writeFile(this.trainingFolder, fileWithExtension, updatedContent);
        return await this.fetchMetadata();
    }

    async deleteTrainingForModel(fileName: any): Promise<Metadata[]> {
        const filePath = makePath(this.trainingFolder, fileName);
        await fs.rm(filePath);
        return await this.fetchMetadata();
    }

    async loadTrainingForModel(fileName: any): Promise<any> {
        const filePath = makePath(this.trainingFolder, fileName);
        try {
            await fs.access(filePath);
            const data = await fs.readFile(filePath, { encoding: 'utf8' });
            return data;
        } catch {
            // File does not exist
            return '';
        }
    }

    async listTrainedModels(includeJson: boolean = true): Promise<Metadata[]> {
        const metadata = await this.fetchMetadata();
        if (includeJson) {
            await Promise.all(metadata.map(async (m) => (m.content = await this.loadTrainingForModel(m.fileName))));
        }
        return metadata;
    }

    private async fetchMetadata(): Promise<Metadata[]> {
        const files = await fs.readdir(this.trainingFolder, { recursive: true });
        return await Promise.all(
            files
                .filter(fileName => isKnownExtension(path.extname(fileName)))
                .map(async fileName => {
                    const filePath = makePath(this.trainingFolder, fileName);
                    const stats = await fs.stat(filePath);
                    return new Metadata({
                        fileName: fileName.replace(path.sep, '/'), // Avoid Windows backslashes
                        lastModified: stats.mtime,
                        type: path.extname(fileName).substring(1),
                    });
                }),
        );
    }
}

async function writeFile(folder: string, fileName: string, content: any) {
    const absoluteFileName = makePath(folder, fileName);
    const directory = path.resolve(folder, path.dirname(fileName))

    // Create directory if it doesn't exist
    try {
        await fs.access(directory, fs.constants.F_OK);
    } catch {
        LocalTrainingStorage.logAction("MKDIR  " + directory);
        await fs.mkdir(directory, { recursive: true });
    }

    await fs.writeFile(absoluteFileName, content, { encoding: 'utf8' });
}

function makePath(rootFolder: string, artifactName: string) {
    // Check to make sure no one is reading/writing outside of the repository folder
    const fullPathOfArtifact = path.resolve(rootFolder, artifactName);
    const fullPathOfRepository = path.resolve(rootFolder);
    if (!fullPathOfArtifact.startsWith(fullPathOfRepository)) {
        throw new Error('Someone is trying to read outside of the repository context: ' + artifactName);
    }

    // Check for valid extension; cannot just load anything from the server
    const extension = path.extname(fullPathOfArtifact);
    if (!isKnownExtension(extension)) {
        throw new Error(`'Invalid extension '${extension}' for file '${artifactName}'`);
    }
    return fullPathOfArtifact;
}
