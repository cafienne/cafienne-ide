import CafienneImplementationDefinition from "@repository/definition/extensions/cafienneimplementationdefinition";
import ReferableElementDefinition from "@repository/definition/referableelementdefinition";
import ModelDefinition from "../modeldefinition";
import ElementDefinition from "../elementdefinition";

export default class ParameterDefinition<M extends ModelDefinition> extends ReferableElementDefinition<M> {
    required: boolean = false;
    isNew: boolean;
    constructor(importNode: Element, caseDefinition: M, parent: ElementDefinition<M>) {
        super(importNode, caseDefinition, parent);
        this.required = this.parseImplementation(CafienneImplementationDefinition).parseBooleanAttribute('required', false);
        this.isNew = false; // This property is used in the HumanTaskEditor and ProcessTaskEditor
    }

    createExportNode(parentNode: Element, tagName: string, ...properties: any[]) {
        // Parameters have different tagnames depending on their type, so this must be passed.
        super.createExportNode(parentNode, tagName, properties);
        if (this.required) { // Required is a customization to the spec, put in an extension element
            this.createImplementationNode().setAttribute('required', 'true');
        }
    }
}
