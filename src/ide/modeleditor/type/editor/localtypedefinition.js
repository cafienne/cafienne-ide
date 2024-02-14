import TypeFile from "@repository/serverfile/typefile";
import TypeEditor from "./typeeditor";
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

export class MainTypeDefinition extends LocalTypeDefinition {
    /**
     * 
     * @param {TypeEditor} editor 
     * @param {TypeFile} file 
     */
    constructor(editor, file) {
        super(editor, file, undefined);
        this.root = this; // Cannot set root through super.
        this.files = {};
        // First register ourselves
        this.files[file.fileName] = new LocalTypeDefinition(this.editor, file, this);
    }

    get json() {
        return this.definition.toJSONSchema();
    }

    get xml() {
        return this.definition.toXML();
    }

    /**
     * 
     * @param {TypeFile} file 
     * @returns {LocalTypeDefinition}
     */
    registerLocalDefinition(file) {
        if (!file) {
            console.warn('Trying to register a local type without passing a file ...');
            return;
        }
        if (!this.files[file.fileName]) {
            this.files[file.fileName] = new LocalTypeDefinition(this.editor, file, this);
        }
        return this.files[file.fileName];
    }
}
