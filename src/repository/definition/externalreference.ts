import ServerFile from "@repository/serverfile/serverfile";
import ModelDefinition from "./modeldefinition";
import XMLSerializable from "./xmlserializable";

export default class ExternalReference<M extends ModelDefinition> {
    private _file?: ServerFile<M>;
    constructor(private element: XMLSerializable, private ref: string) {
    }

    isEmpty() {
        return this.fileName === '';
    }

    nonEmpty() {
        return !this.isEmpty();
    }

    get fileName() {
        return this.ref;
    }

    get file() {
        return this._file;
    }

    resolve() {
        this._file = this.element.loadFile(this.fileName);
        if (this.nonEmpty() && this._file === undefined) {
            console.warn(this.element + ": Did not receive a file for " + this.fileName);
            return;
        }

    }

    getDefinition(): M | undefined {
        if (this._file && !this._file.definition) {
            this._file.parse();
        }
        return this._file?.definition;
    }

    rename(oldFileName: string, newFileName: string) {
        if (this.ref === oldFileName) {
            this.ref = newFileName;
            return true;
        } else {
            return false;
        }
    }

    update(newFileName: string) {
        if (this.ref !== newFileName) {
            // console.log("Setting new reference inside " + this.element +" to value " + newFileName +" (old value was: " + this.ref +")");
            this.ref = newFileName;
            this._file = this.element.loadFile(this.ref);
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
        const actualReferences = this.references.filter(ref => ref.nonEmpty());
        if (actualReferences.length > 0) {
            console.log("Element " + this.element.constructor.name + " wants to load " + actualReferences.map(e => e.fileName).join(', '));
            this.references.forEach(reference => reference.resolve());
            this.element.resolveExternalReferences();    
        }
    }

    get all() {
        return [...this.references];
    }

    add<M extends ModelDefinition>(fileName: string): ExternalReference<M> {
        const reference = this.references.find(ref => ref.fileName === fileName);
        if (reference) {
            return <ExternalReference<M>>reference;
        }

        const newReference = new ExternalReference<M>(this.element, fileName);
        this.references.push(newReference);
        return newReference;
    }
}
