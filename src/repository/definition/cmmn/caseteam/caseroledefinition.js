import CMMNElementDefinition from "../../cmmnelementdefinition";

export default class CaseRoleDefinition extends CMMNElementDefinition {
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
    }

    createExportNode(parentNode) {
        super.createExportNode(parentNode, 'role');
    }
}