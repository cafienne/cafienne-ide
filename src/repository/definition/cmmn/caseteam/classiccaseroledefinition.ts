import CaseRoleDefinition from "@repository/definition/caseteam/caseroledefinition";
import CaseDefinition from "../casedefinition";
import CaseTeamDefinition from "./caseteamdefinition";
import CMMNElementDefinition from "@repository/definition/cmmnelementdefinition";

export default class ClassicCaseRoleDefinition extends CMMNElementDefinition {
    constructor(importNode: Element, public caseDefinition: CaseDefinition, parent: CaseTeamDefinition) {
        super(importNode, caseDefinition, parent);
    }

    createExportNode(parentNode: Element) {
        super.createExportNode(parentNode, 'role');
    }
}
