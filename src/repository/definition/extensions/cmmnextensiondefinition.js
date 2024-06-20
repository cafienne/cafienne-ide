import ElementDefinition from "../elementdefinition";

/**
 * Simple helper class to support specific extensions to CMMN   
 */
export default class CMMNExtensionDefinition extends ElementDefinition {
    constructor(element, modelDefinition, parent) {
        super(element, modelDefinition, parent);
    }

    createExportNode(parentNode, tagName, ...propertyNames) {
        super.createExtensionNode(parentNode, tagName, propertyNames);
    }
}
