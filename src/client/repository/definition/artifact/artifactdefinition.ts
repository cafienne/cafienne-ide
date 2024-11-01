import CaseDefinition from "../cmmn/casedefinition";
import CMMNElementDefinition from "../cmmnelementdefinition";
import UnnamedCMMNElementDefinition from "../unnamedcmmnelementdefinition";

export default class ArtifactDefinition extends UnnamedCMMNElementDefinition {
    constructor(importNode: Element, public caseDefinition: CaseDefinition, parent: CMMNElementDefinition) {
        super(importNode, caseDefinition, parent);
    }

    createExportNode(parentNode: Element, tagName = 'artifact', ...propertyNames: any[]) {
        super.createExportNode(parentNode, tagName, propertyNames);
    }
}
