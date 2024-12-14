import ElementDefinition from "../elementdefinition";
import ModelDefinition from "../modeldefinition";
import XMLSerializable from "../xmlserializable";
import ExternalReference from "./externalreference";
import InternalReference from "./internalreference";
import Reference from "./reference";

export default class ReferenceList<R extends Reference> {
    constructor(public element: XMLSerializable) { }

    protected references: R[] = [];

    get all(): R[] {
        return [...this.references];
    }

    add<E extends R>(fileName: string, constructor?: new (element: XMLSerializable, fileName: string) => E): E {
        const newReference = constructor ? new constructor(this.element, fileName) : <E>this.create(fileName);
        this.references.push(newReference);
        return newReference;
    }

    resolve() {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    protected create<E extends R>(ref: string): E {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }
}

export class InternalReferenceList extends ReferenceList<InternalReference<ElementDefinition<ModelDefinition>>> {
    protected create<E extends InternalReference<ElementDefinition<ModelDefinition>>>(ref: string): E {
        return <E>new InternalReference(<ElementDefinition<ModelDefinition>>this.element, ref);
    }

    resolve() {
        const actualReferences = this.references.filter(ref => ref.nonEmpty);
        if (actualReferences.length > 0) {
            actualReferences.forEach(reference => reference.resolve());
            this.element.resolveInternalReferences();
        }
    }
}

export class ExternalReferenceList extends ReferenceList<ExternalReference<ModelDefinition>> {
    protected create<E extends ExternalReference<ModelDefinition>>(fileName: string): E {
        return <E>new ExternalReference(this.element, fileName);
    }

    resolve() {
        const actualReferences = this.references.filter(ref => ref.nonEmpty);
        if (actualReferences.length > 0) {
            console.log(`- ${this.element} references ${actualReferences.map(e => e.value).join(', ')}`);
            this.references.forEach(reference => reference.resolve());
            this.element.resolveExternalReferences();
        }
    }
}
