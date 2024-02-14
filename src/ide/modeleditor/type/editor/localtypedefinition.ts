import TypeFile from "@repository/serverfile/typefile";
import TypeEditor from "./typeeditor";
import TypeRenderer from "./typerenderer";
import TypeDefinition from "@repository/definition/type/typedefinition";

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

export class MainTypeDefinition extends LocalTypeDefinition {
    files: any = {};
    /**
     * 
     * @param {TypeEditor} editor 
     * @param {TypeFile} file 
     */
    constructor(editor: TypeEditor, file: TypeFile) {
        super(editor, file, undefined);
        this.root = this; // Cannot set root through super.
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
    registerLocalDefinition(file: TypeFile): LocalTypeDefinition | undefined {
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
