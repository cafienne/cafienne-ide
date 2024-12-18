import Metadata from '@repository/serverfile/metadata';
import DefinitionStorage from './definitionstorage';
import * as fs from 'fs';
import * as path from 'path';

function isKnownExtension(extension: string): boolean {
    return ['.case', '.process', '.humantask', '.dimensions', '.cfid', '.type', '.xml'].indexOf(extension) >= 0;
}

export default class FileSystemDefinitionStorage implements DefinitionStorage {
    constructor(private readonly definitionFolder: string) {
        this.initialize();
    }

    private async initialize(): Promise<void> {
        if (!fs.existsSync(this.definitionFolder)) {
            await fs.promises.mkdir(this.definitionFolder, { recursive: true });
        }
    }

    async renameFile(fileName: any, newFileName: string, updatedContent: any): Promise<Metadata[]> {
        const oldPath = path.join(this.definitionFolder, fileName);
        const newPath = path.join(this.definitionFolder, newFileName);

        await fs.promises.rename(oldPath, newPath);
        await fs.promises.writeFile(newPath, updatedContent, { encoding: 'utf8' });

        return await this.fetchMetadata();
    }

    async saveFile(fileName: any, source: any): Promise<Metadata[]> {
        const filePath = path.join(this.definitionFolder, fileName);
        await fs.promises.writeFile(fileName, source, { encoding: 'utf8' });
        return await this.fetchMetadata();
    }

    async deleteFile(fileName: any): Promise<Metadata[]> {
        const filePath = path.join(this.definitionFolder, fileName);
        await fs.promises.rm(filePath);
        return await this.fetchMetadata();
    }

    async load(fileName: any): Promise<any> {
        const filePath = path.join(this.definitionFolder, fileName);
        const data = await fs.promises.readFile(fileName, { encoding: 'utf8' });
        return data;
    }

    async readAll(): Promise<Metadata[]> {
        const metadata = await this.fetchMetadata();
        await Promise.all(metadata.map(async (m) => (m.serverContent = await this.load(m.fileName))));
        return metadata;
    }

    private async fetchMetadata(): Promise<Metadata[]> {
        const files = await fs.promises.readdir(this.definitionFolder, { recursive: true });
        return await Promise.all(
            files
                .filter((file) => isKnownExtension(path.extname(file)))
                .map(async (file) => {
                    const filePath = path.join(this.definitionFolder, file);
                    const stats = await fs.promises.stat(filePath);
                    return new Metadata({
                        fileName: file,
                        lastModified: stats.mtime,
                        error: null,
                        type: path.extname(file).substring(1),
                        serverContent: null,
                    });
                }),
        );
    }
}
