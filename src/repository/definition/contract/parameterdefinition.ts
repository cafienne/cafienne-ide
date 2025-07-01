import { Element } from "../../../util/xml";
import ElementDefinition from "../elementdefinition";
import CafienneImplementationDefinition from "../extensions/cafienneimplementationdefinition";
import ModelDefinition from "../modeldefinition";

export default class ParameterDefinition<M extends ModelDefinition = ModelDefinition> extends ElementDefinition<M> {
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
}
