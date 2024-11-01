import CafienneImplementationDefinition from "../extensions/cafienneimplementationdefinition";
import ElementDefinition from "../elementdefinition";
import CaseFileDefinitionDefinition from "./casefileitemdefinitiondefinition";

export default class PropertyDefinition extends ElementDefinition<CaseFileDefinitionDefinition> {
    type: string;
    isBusinessIdentifier: any;
    constructor(importNode: Element, modelDefinition: CaseFileDefinitionDefinition, parent?: ElementDefinition<CaseFileDefinitionDefinition>) {
        super(importNode, modelDefinition, parent);
        this.type = this.parseAttribute('type', '');
        this.isBusinessIdentifier = this.parseImplementation(CafienneImplementationDefinition).parseBooleanAttribute('isBusinessIdentifier', false);
    }

    createExportNode(parent: Element) {
        super.createExportNode(parent, 'property', 'name', 'type');
        if (this.isBusinessIdentifier) { // BusinessIdentifier is a customization to the spec, put in an extension element
            this.createImplementationNode().setAttribute('isBusinessIdentifier', 'true');
        }
    }
}
