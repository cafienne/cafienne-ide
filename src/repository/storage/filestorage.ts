import Metadata from "../serverfile/metadata";

abstract class FileStorage {
    abstract renameModel(fileName: string, newFileName: string, updatedContent: any): Promise<Metadata[]>;

    abstract saveModel(fileName: string, source: any): Promise<Metadata[]>;

    abstract deleteModel(fileName: string): Promise<Metadata[]>;

    abstract loadModel(fileName: string): Promise<any>;

    abstract listModels(): Promise<Metadata[]>;

    abstract deploy(fileName: string, body: any): Promise<void>;
}

export default FileStorage;