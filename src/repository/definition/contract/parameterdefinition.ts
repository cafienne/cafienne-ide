import CafienneImplementationDefinition from "@repository/definition/extensions/cafienneimplementationdefinition";
import ReferableElementDefinition from "@repository/definition/referableelementdefinition";
import ModelDefinition from "../modeldefinition";
import ElementDefinition from "../elementdefinition";
import ValidationContext from "@repository/validate/validation";

export default class ParameterDefinition<M extends ModelDefinition> extends ReferableElementDefinition<M> {
    required: boolean = false;
    isNew: boolean;
    constructor(importNode: Element, caseDefinition: M, parent: ElementDefinition<M>) {
        super(importNode, caseDefinition, parent);
        this.required = this.parseImplementation(CafienneImplementationDefinition).parseBooleanAttribute('required', false);
        this.isNew = false; // This property is used in the HumanTaskEditor and ProcessTaskEditor
    }

    createExportNode(parentNode: Element, tagName: string, ...propertyNames: any[]) {
        // Parameters have different tagnames depending on their type, so this must be passed.
        super.createExportNode(parentNode, tagName, propertyNames);
        if (this.required) { // Required is a customization to the spec, put in an extension element
            this.createImplementationNode().setAttribute('required', 'true');
        }
    }

    validate(validationContext: ValidationContext) {
        // no validations yet
    }
}
