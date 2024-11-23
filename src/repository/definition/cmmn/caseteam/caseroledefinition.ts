import CaseTeamRoleDefinition from "@repository/definition/caseteam/caseteamroledefinition";
import CaseDefinition from "../casedefinition";
import CaseTeamDefinition from "./caseteamdefinition";
import CMMNElementDefinition from "@repository/definition/cmmnelementdefinition";

export default class CaseRoleDefinition extends CMMNElementDefinition {
    constructor(importNode: Element, public caseDefinition: CaseDefinition, parent: CaseTeamDefinition, role: CaseTeamRoleDefinition) {
        super(importNode, caseDefinition, parent);
        if (role) {
            // Copy the id/name of the caseTeamRoleDefinition (from the external reference)
            this.name = role.name;
            this.id = role.id; 
        }
    }

    createExportNode(parentNode: Element) {
        super.createExportNode(parentNode, 'role');
    }
}
