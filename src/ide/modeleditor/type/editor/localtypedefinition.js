import TypeFile from "@repository/serverfile/typefile";
import TypeEditor from "./typeeditor";
import MainTypeDefinition from "./maintypedefinition";
import TypeRenderer from "./typerenderer";

export default class LocalTypeDefinition {
    /**
     * 
     * @param {TypeEditor} typeEditor 
     * @param {TypeFile} file 
     * @param {MainTypeDefinition} root 
     */
    constructor(typeEditor, file, root) {
        this.editor = typeEditor;
        this.file = file;
        this.root = root;
        this.definition = file.definition;
    }

    /**
     * 
     * @param {TypeRenderer} source 
     */
    save(source = undefined) {
        this.file.source = this.definition.toXML();
        this.file.save();
        TypeRenderer.refreshOthers(source);
    }

    /**
     * 
     * @param {TypeFile} file 
     * @returns {LocalTypeDefinition}
     */
    registerLocalDefinition(file) {
        return this.root.registerLocalDefinition(file);
    }

    /**
     * 
     * @param {LocalTypeDefinition} other 
     * @returns 
     */
    sameFile(other) {
        return other && this.file.fileName === other.file.fileName;
    }
}
