import XMLSerializable from "../xmlserializable";

abstract class ReferencingAttribute {
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

    abstract removeDefinitionReference(element: XMLSerializable): void;

    get value() {
        return this.ref;
    }

    setExportAttribute(name: string) {
        if (this.nonEmpty) {
            this.element.exportNode?.setAttribute(name, this.value);
        }
    }
}

export default ReferencingAttribute;
