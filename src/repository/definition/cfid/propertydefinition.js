import CafienneImplementationDefinition from "../extensions/cafienneimplementationdefinition";
import ElementDefinition from "../elementdefinition";

export default class PropertyDefinition extends ElementDefinition {
    constructor(importNode, modelDefinition, parent) {
        super(importNode, modelDefinition, parent);
        this.name = this.parseAttribute('name', '');
        this.type = this.parseAttribute('type', '');
        this.isBusinessIdentifier = this.parseImplementation(CafienneImplementationDefinition).parseBooleanAttribute('isBusinessIdentifier', false);
    }

    createExportNode(parent) {
        super.createExportNode(parent, 'property', 'name', 'type');
        if (this.isBusinessIdentifier) { // BusinessIdentifier is a customization to the spec, put in an extension element
            this.createImplementationNode().setAttribute('isBusinessIdentifier', 'true');
        }
    }
}
