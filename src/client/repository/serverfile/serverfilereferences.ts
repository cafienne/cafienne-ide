import ServerFile from "@repository/serverfile/serverfile";
import Util from "@util/util";
import ModelDefinition from "../definition/modeldefinition";

export default class ServerFileReferences<M extends ModelDefinition> {
    files: ServerFile<ModelDefinition>[] = [];

    constructor(private source: ServerFile<M>) {
    }

    get size() {
        return this.files.length;
    }

    clear() {
        this.files.forEach(file => file.clear());
        Util.clearArray(this.files);
    }

    /**
     * Returns all files that this file references, and also all _their_ references.
     */
    get all() {
        const set = new Array();
        this.files.forEach(file => {
            set.push(file);
            file.references.all.forEach((reference: ServerFile<ModelDefinition>) => set.push(reference));
        });
        return Util.removeDuplicates(set);
    }

    contains(file: ServerFile<ModelDefinition>) {
        return this.all.find(reference => reference === file) !== undefined;
    }

    async load<X extends ModelDefinition>(fileName: string): Promise<ServerFile<X>> {
        const file = this.files.find(file => file.fileName === fileName);
        if (file) {
            // console.log(this.source.fileName + " requested " + fileName + " and it is already in our list, with definition: " + file.definition)
            // @ts-ignore ==> if you cast to the wrong type, that's really your problem ;)
            return Promise.resolve(file);
        } else {
            // console.log(this.source.fileName + " requested " + fileName + " and need to load it")
            const file = await <Promise<ServerFile<X>>>this.source.repository.load(fileName);
            this.files.push(file);
            return file;
        }
    }
}
