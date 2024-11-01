import TypeDefinition from "@repository/definition/type/typedefinition";
import TypeFile from "@repository/serverfile/typefile";
import MainTypeDefinition from "./maintypedefinition";
import TypeEditor from "./typeeditor";
import TypeRenderer from "./typerenderer";

export default class LocalTypeDefinition {
    definition: TypeDefinition;
    /**
     * 
     * @param {TypeEditor} editor 
     * @param {TypeFile} file 
     * @param {MainTypeDefinition} root 
     */
    constructor(public editor: TypeEditor, public file: TypeFile, public root?: MainTypeDefinition) {
        if (! file.definition) {
            throw new Error('We need a definition for this');
        }
        this.definition = file.definition;
    }

    /**
     * 
     * @returns {Promise<void>}
     */
    async save(source?: TypeRenderer): Promise<void> {
        this.file.source = this.definition.toXML();
        TypeRenderer.refreshOthers(source);
        return this.file.save().then();
    }

    /**
     * 
     * @param {TypeFile} file 
     * @returns {LocalTypeDefinition}
     */
    registerLocalDefinition(file: TypeFile) {
        return this.root?.registerLocalDefinition(file);
    }

    /**
     * 
     * @param {LocalTypeDefinition} other 
     * @returns 
     */
    sameFile(other: LocalTypeDefinition) {
        return other && this.file.fileName === other.file.fileName;
    }
}
