import XMLSerializable from "../xmlserializable";
import ReferencingAttribute from "./referencingattribute";

export default class Reference extends ReferencingAttribute {
    constructor(element: XMLSerializable, ref: string) {
        super(element, ref);
    }

    references(something: string | XMLSerializable | Reference) {
        if (something instanceof XMLSerializable) {
            return this.ref === something.id;
        } else if (something instanceof Reference) {
            return this === something;
        } else {
            return this.ref === something;
        }
    }

    resolve() {
    }
}
