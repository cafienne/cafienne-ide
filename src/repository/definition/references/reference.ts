import XMLSerializable from "../xmlserializable";

export default class Reference {
    constructor(protected element: XMLSerializable, protected ref: string) {
    }

    references(something: string | XMLSerializable) {
        if (something instanceof XMLSerializable) {
            return this.ref === something.id;
        } else {
            return this.ref === something;
        }
    }

    get value() {
        return this.ref;
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
