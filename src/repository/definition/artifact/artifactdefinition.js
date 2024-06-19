import UnnamedCMMNElementDefinition from "../unnamedcmmnelementdefinition";

export default class ArtifactDefinition extends UnnamedCMMNElementDefinition {
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
    }

    createExportNode(parentNode, tagName = 'artifact', ...propertyNames) {
        super.createExportNode(parentNode, tagName, propertyNames);
    }
}
