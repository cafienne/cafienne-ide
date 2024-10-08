import TypeFile from "@repository/serverfile/typefile";
import TypeEditor from "./typeeditor";
import TypeRenderer from "./typerenderer";
import TypeDefinition from "@repository/definition/type/typedefinition";
import MainTypeDefinition from "./maintypedefinition";

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
     * @param {TypeRenderer} source 
     */
    save(source?: TypeRenderer) {
        this.file.source = this.definition.toXML();
        this.file.save();
        TypeRenderer.refreshOthers(source);
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
