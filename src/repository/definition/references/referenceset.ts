import ElementDefinition from "../elementdefinition";
import XMLSerializable from "../xmlserializable";
import InternalReference from "./internalreference";
import ReferencingAttribute from "./referencingattribute";

export class ReferenceSet<I extends InternalReference<ElementDefinition>> extends ReferencingAttribute {
    references: Array<I> = [];

    constructor(protected element: ElementDefinition, ref: string, private creator?: new (element: ElementDefinition, ref: string) => I) {
        super(element, ref);
        const references = this.ref.split(' ').filter(string => string.trim().length > 0);
        this.references = references.map(reference => this.create(reference));
    }

    private create(value: string | ElementDefinition): I {
        const ref = value instanceof ElementDefinition ? value.id : value;
        const item = this.creator ? new this.creator(this.element, ref) : <I>new InternalReference(<ElementDefinition>this.element, ref);
        return item;
    }

    get list() {
        return this.references.filter(ref => ref.nonEmpty);
    }

    add(reference: string | ElementDefinition) {
        this.references.push(this.create(reference).resolve());
    }

    remove(value: string | XMLSerializable | I) {
        this.references.find(reference => reference.references(value))?.remove();
    }

    get value() {
        const values = this.list.map(reference => reference.value).filter(reference => reference.trim().length > 0);
        return values.length ? values.join(' ') : '';
    }

    removeDefinitionReference(element: XMLSerializable) {
        this.remove(element);
    }

    find(reference: string | ElementDefinition): I | undefined {
        return this.list.find(item => item.references(reference));
    }
}
