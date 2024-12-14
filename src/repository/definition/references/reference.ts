import XMLSerializable from "../xmlserializable";

export default class Reference<D extends XMLSerializable> {
    constructor(protected element: XMLSerializable, protected ref: string) {
    }

    references(something: string | XMLSerializable) {
        if (something instanceof XMLSerializable) {
            return this.ref === something.id;
        } else {
            return this.ref === something;
        }
    }

    getDefinition(): D | undefined {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    get value() {
        return this.ref;
    }

    get id(): string {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    get name(): string {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    get description(): string {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    /**
     * true if the fileName of this reference has a value, false otherwise.
     */
    get nonEmpty() {
        return this.ref.length > 0;
    }

    setExportAttribute(name: string) {
        if (this.nonEmpty) {
            this.element.exportNode?.setAttribute(name, this.ref);
        }
    }

    resolve() {
    }
}

