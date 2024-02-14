import TypeFile from "@repository/serverfile/typefile";
import LocalTypeDefinition from "./localtypedefinition";
import TypeEditor from "./typeeditor";

export default class MainTypeDefinition extends LocalTypeDefinition {
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
