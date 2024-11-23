import * as fs from "fs/promises";
import * as path from "path";
import RepositoryConfiguration from "../../config/config";
import Metadata from "../serverfile/metadata";
import FileStorage from "./filestorage";

function isKnownExtension(extension: string): boolean {
    return ['.case', '.process', '.humantask', '.dimensions', '.cfid', '.type', '.caseteam', '.xml'].indexOf(extension) >= 0;
}

export default class LocalFileStorage extends FileStorage {
    static logAction = (msg: string): void => { };

    public sourceFolder = this.config.repository;
    public deployFolder = this.config.deploy;

    constructor(public config: RepositoryConfiguration) {
        super();
        this.verifyConfiguration();
    }

    private async verifyConfiguration(): Promise<void> {
        // source folder must be present and existing
        await this.ensureFolderExists(this.sourceFolder, 'repository');
        await this.ensureFolderIsNotFile(this.sourceFolder, 'repository');
        // target folder will be created if it does not yet exist, so only need to verify that it is not a file
        await this.ensureFolderIsNotFile(this.deployFolder, 'deploy');
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

    private async ensureFolderExists(folder: any, key: string) {
        const dir = path.resolve(folder);
        try {
            await fs.access(dir, fs.constants.F_OK | fs.constants.W_OK | fs.constants.R_OK | fs.constants.X_OK);
        } catch {
            const msg = `Repository configuration failure for '${key}' setting\n\n "${folder}" does not exist, or cannot be accessed with 'rwx' permissions\n`;
            console.error(msg);
            throw new Error(msg);
        }
    }

    async renameModel(fileName: any, newFileName: string, updatedContent: any): Promise<Metadata[]> {
        const oldPath = makePath(this.sourceFolder, fileName);
        const newPath = makePath(this.sourceFolder, newFileName);

        await fs.rename(oldPath, newPath);
        await writeFile(this.sourceFolder, newFileName, updatedContent);

        return await this.fetchMetadata();
    }

    async saveModel(fileName: any, source: any): Promise<Metadata[]> {
        await writeFile(this.sourceFolder, fileName, source);
        return await this.fetchMetadata();
    }

    async deleteModel(fileName: any): Promise<Metadata[]> {
        const filePath = makePath(this.sourceFolder, fileName);
        await fs.rm(filePath);
        return await this.fetchMetadata();
    }

    async loadModel(fileName: any): Promise<any> {
        const filePath = makePath(this.sourceFolder, fileName);
        const data = await fs.readFile(filePath, { encoding: 'utf8' });
        return data;
    }

    async listModels(includeJson: boolean = true): Promise<Metadata[]> {
        const metadata = await this.fetchMetadata();
        if (includeJson) {
            await Promise.all(metadata.map(async (m) => (m.content = await this.loadModel(m.fileName))));
        }
        return metadata;
    }

    async deploy(fileName: string, body: any): Promise<void> {
        return writeFile(this.deployFolder, fileName, body);
    }

    private async fetchMetadata(): Promise<Metadata[]> {
        const files = await fs.readdir(this.sourceFolder, { recursive: true });
        return await Promise.all(
            files
                .filter(fileName => isKnownExtension(path.extname(fileName)))
                .map(async fileName => {
                    const filePath = makePath(this.sourceFolder, fileName);
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
        LocalFileStorage.logAction("MKDIR  " + directory);
        await fs.mkdir(directory, { recursive: true });
    }

    // Add a newline, since some XML serializations don't print it, and then it looks ugly in git
    if (typeof content === 'string' && !content.endsWith('\n')) {
        content = content + '\n';
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
