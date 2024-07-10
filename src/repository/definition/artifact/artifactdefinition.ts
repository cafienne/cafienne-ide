import CaseDefinition from "../cmmn/casedefinition";
import CMMNElementDefinition from "../cmmnelementdefinition";
import UnnamedCMMNElementDefinition from "../unnamedcmmnelementdefinition";

export default class ArtifactDefinition extends UnnamedCMMNElementDefinition {
    constructor(importNode: Element, caseDefinition: CaseDefinition, parent: CMMNElementDefinition) {
        super(importNode, caseDefinition, parent);
    }

    createExportNode(parentNode: Node, tagName: string = 'artifact', ...propertyNames: string[]): void {
        super.createExportNode(parentNode, tagName, propertyNames);
    }
}
