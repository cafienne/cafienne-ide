import XMLSerializable from "../xmlserializable";

export default class ReferencingAttribute {
    constructor(protected element: XMLSerializable, protected ref: string, public attributeName: string) {
    }
}
