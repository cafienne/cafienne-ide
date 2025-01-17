import ServerFile from "../../serverfile/serverfile";
import ModelDefinition from "../modeldefinition";
import XMLSerializable from "../xmlserializable";
import Reference from "./reference";

export default class ExternalReference<M extends ModelDefinition> extends Reference {
    private _file?: ServerFile<M>;
    constructor(element: XMLSerializable, ref: string) {
        super(element, ref);
        element.externalReferences.register(this);
    }

    /**
     * The name of the file that we're referencing
     */
    get fileName() {
        // this.fileName is "read-only", and can only be changed by calling update
        // Preferably we take the name from the file itself (especially in case of rename this is required)
        return this.file ? this.file.fileName : this.ref;
    }

    get file() {
        // this.file is "read-only"
        return this._file;
    }

    get value() {
        return this.fileName;
    }

    /**
     * Overridable method to load a file for the reference
     */
    protected loadFile() {
        this._file = this.element.loadFile(this.fileName);
        if (this.nonEmpty && this._file === undefined) {
            console.warn(this.element + ": Did not receive a file for " + this.fileName);
            return;
        }
        if (this._file && !this._file.definition) {
            this._file.parse();
        }
    }

    resolve() {
        this.loadFile();
    }

    getDefinition(): M | undefined {
        return this._file?.definition;
    }

    update(newFileName: string) {
        if (this.ref !== newFileName) {
            // console.log("Setting new reference inside " + this.element +" to value " + newFileName +" (old value was: " + this.ref +")");

            // Clear existing file pointer when updating to a new ref.
            this._file = undefined;
            this.ref = newFileName;
            this.loadFile();
        }
    }

    removeDefinitionReference(element: XMLSerializable) {
        if (this.references(element)) {
            this.update('');
        }
    }

    toString() {
        return this.fileName;
    }
}
