import ElementDefinition from "../elementdefinition";
import ModelDefinition from "../modeldefinition";
import Reference from "./reference";

export default class InternalReference<I extends ElementDefinition<ModelDefinition>> extends Reference {
    private target?: I;
    constructor(protected element: ElementDefinition<ModelDefinition>, ref: string) {
        super(element, ref);
    }

    /**
     * true if the fileName of this reference has a value, false otherwise.
     */
    get nonEmpty() {
        return this.ref.length > 0;
    }

    get isEmpty() {
        return !this.nonEmpty;
    }

    resolve() {
        this.loadDefinition()
    }

    getDefinition(): I | undefined {
        return this.target;
    }

    get id() {
        return this.target ? this.target.id : ''
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

    toString() {
        return this.ref;
    }
}
