import Metadata from "@repository/serverfile/metadata";


export default interface DefinitionStorage {
    renameFile(fileName: any, newFileName: string, updatedContent: any): Promise<Metadata[]>;
    saveFile(fileName: any, source: any): Promise<Metadata[]>;
    deleteFile(fileName: any): Promise<Metadata[]>;
    load(fileName: any): Promise<any>;
    readAll(): Promise<Metadata[]>;
}
