import XMLSerializable from "../xmlserializable";

export default class ReferencingAttribute {
    constructor(protected element: XMLSerializable, protected ref: string, public attributeName?: string) {
    }

    /**
     * true if the fileName of this reference has a value, false otherwise.
     */
    get nonEmpty() {
        return this.value.trim().length > 0;
    }

    get isEmpty() {
        return !this.nonEmpty;
    }

    removeDefinitionReference(element: XMLSerializable) {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    get value() {
        return this.ref;
    }

    setExportAttribute(name: string) {
        if (this.nonEmpty) {
            this.element.exportNode?.setAttribute(name, this.value);
        }
    }
}
