import ModelDefinition from "./definition/modeldefinition";
import Metadata from "./serverfile/metadata";
import ServerFile from "./serverfile/serverfile";

export default class RepositoryBase {
    public list: Array<ServerFile<ModelDefinition>> = [];

    hasFile(fileName: string): boolean {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    updateMetadata(newServerFileList: Array<Metadata>) {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    async load<X extends ModelDefinition>(fileName: string): Promise<ServerFile<X>> {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }
}
