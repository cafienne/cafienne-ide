import ElementDefinition from "../definition/elementdefinition";
import ModelDefinition from "../definition/modeldefinition";
import XMLSerializable from "../definition/xmlserializable";

export default class Remark<E extends XMLSerializable> {
    constructor(public readonly element: E, public description: string) {
    }

    isWarning(): boolean {
        return false;
    }

    isError(): boolean {
        return false;
    }

    toString() {
        return `${this.constructor.name}: ${this.description} (in ${this.modelDefinition.file.fileName})`;
    }

    get modelDefinition(): ModelDefinition {
        if (this.element instanceof ModelDefinition) {
            return this.element;
        } else if (this.element instanceof ElementDefinition) {
            return this.element.modelDefinition;
        } else {
            const error = new Error('Encountered a class of type ' + this.element.constructor.name +' which is entirely unexpected');
            console.error('Unexpected!!!', error);
            throw error;
        }
    }
}
