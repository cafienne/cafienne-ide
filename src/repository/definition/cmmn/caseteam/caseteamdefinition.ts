import CMMNElementDefinition from "@repository/definition/cmmnelementdefinition";
import UnnamedCMMNElementDefinition from "../../unnamedcmmnelementdefinition";
import CaseDefinition from "../casedefinition";
import CaseRoleDefinition from "./caseroledefinition";

export default class CaseTeamDefinition extends UnnamedCMMNElementDefinition {
    roles: CaseRoleDefinition[];
    constructor(importNode: Element, caseDefinition: CaseDefinition, parent: CMMNElementDefinition) {
        super(importNode, caseDefinition, parent);
        /** @type {Array<CaseRoleDefinition>} */
        this.roles = this.parseElements('role', CaseRoleDefinition);
        // Clear our name and id element, so that caseteam definition is not accidentally found as a case role element
        this.name = '';
        this.id = '';
    }

    createExportNode(parentNode: Element) {
        super.createExportNode(parentNode, 'caseRoles', 'roles');
    }
}
