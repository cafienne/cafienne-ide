import ElementDefinition from "@repository/definition/elementdefinition";
import CafienneImplementationDefinition from "@repository/definition/extensions/cafienneimplementationdefinition";
import ReferableElementDefinition from "@repository/definition/referableelementdefinition";

export default class ParameterDefinition extends ReferableElementDefinition {
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
        this.required = this.parseImplementation(CafienneImplementationDefinition).parseBooleanAttribute('required', false);
        this.isNew = false; // This property is used in the HumanTaskEditor and ProcessTaskEditor
    }

    referencesElement(element) {
        return element.id === this.bindingRef;
    }

    createExportNode(parentNode, tagName, ...properties) {
        // Parameters have different tagnames depending on their type, so this must be passed.
        super.createExportNode(parentNode, tagName, properties);
        if (this.required) { // Required is a customization to the spec, put in an extension element
            this.createImplementationNode().setAttribute('required', 'true');
        }
    }
}
