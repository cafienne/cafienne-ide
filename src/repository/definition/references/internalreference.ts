import ElementDefinition from "../elementdefinition";
import ModelDefinition from "../modeldefinition";
import XMLSerializable from "../xmlserializable";
import Reference from "./reference";

export default class InternalReference<I extends ElementDefinition<ModelDefinition>> extends Reference {
    private target?: I;
    constructor(protected element: ElementDefinition<ModelDefinition>, ref: string) {
        super(element, ref);
        element.internalReferences.register(this);
    }

    resolve() {
        this.loadDefinition();
        return this;
    }

    getDefinition(): I | undefined {
        return this.target;
    }

    get id() {
        return this.target ? this.target.id : this.value;
    }

    get name(): string {
        return this.target ? this.target.name : ''
    }

    protected loadDefinition() {
        this.target = <I>this.element.modelDefinition.getElement(this.ref);
    }

    update(newReference?: string | I) {
        if (this.ref !== newReference) {
            // console.log("Setting new reference inside " + this.element +" to value " + newFileName +" (old value was: " + this.ref +")");

            // Clear existing file pointer when updating to a new ref.
            this.target = undefined;
            this.ref = newReference ? newReference instanceof ElementDefinition ? newReference.id : newReference : '';
            this.loadDefinition();
        }
    }

    remove() {
        this.update('');
    }

    removeDefinitionReference(element: XMLSerializable) {
        if (this.references(element)) {
            this.update('');
        }
    }

    toString() {
        return this.ref;
    }
}
