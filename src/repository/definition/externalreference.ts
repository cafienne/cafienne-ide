import ServerFile from "@repository/serverfile/serverfile";
import ModelDefinition from "./modeldefinition";
import XMLSerializable from "./xmlserializable";

export default class ExternalReference<M extends ModelDefinition> {
    private _file?: ServerFile<M>;
    constructor(protected element: XMLSerializable, protected ref: string) {
    }

    /**
     * true if the fileName of this reference has a value, false otherwise.
     */
    get nonEmpty() {
        return this.fileName && this.fileName.trim().length > 0;
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

    /**
     * Overridable method to load a file for the reference
     */
    protected loadFile() {
        this._file = this.element.loadFile(this.fileName);
        if (this.nonEmpty && this._file === undefined) {
            console.warn(this.element + ": Did not receive a file for " + this.fileName);
            return;
        }
    }

    resolve() {
        this.loadFile();
    }

    getDefinition(): M | undefined {
        if (this._file && !this._file.definition) {
            this._file.parse();
        }
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

    toString() {
        return this.fileName;
    }
}

export class ReferenceSet {
    constructor(public element: XMLSerializable) { }

    private references: ExternalReference<ModelDefinition>[] = [];

    resolve() {
        const actualReferences = this.references.filter(ref => ref.nonEmpty);
        if (actualReferences.length > 0) {
            console.log("Element " + this.element.constructor.name + " wants to load " + actualReferences.map(e => e.fileName).join(', '));
            this.references.forEach(reference => reference.resolve());
            this.element.resolveExternalReferences();
        }
    }

    get all() {
        return [...this.references];
    }

    add<E extends ExternalReference<ModelDefinition>>(fileName: string, constructor?: new (element: XMLSerializable, fileName: string) => E): E {
        const newReference = constructor ? new constructor(this.element, fileName) : <E> new ExternalReference(this.element, fileName);
        this.references.push(newReference);
        return newReference;
    }
}
