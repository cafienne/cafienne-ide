import CaseTeamModelDefinition from "@repository/definition/caseteam/caseteammodeldefinition";
import CMMNElementDefinition from "@repository/definition/cmmnelementdefinition";
import ExternalReference from "@repository/definition/references/externalreference";
import UnnamedCMMNElementDefinition from "../../unnamedcmmnelementdefinition";
import CaseDefinition from "../casedefinition";
import ClassicCaseRoleDefinition from "./classiccaseroledefinition";

export default class CaseTeamDefinition extends UnnamedCMMNElementDefinition {
    isOldStyle: boolean;
    caseTeamRef: ExternalReference<CaseTeamModelDefinition>;
    classicRoles: ClassicCaseRoleDefinition[];
    constructor(importNode: Element, caseDefinition: CaseDefinition, parent: CMMNElementDefinition) {
        super(importNode, caseDefinition, parent);
        /** @type {Array<ClassicCaseRoleDefinition>} */
        this.classicRoles = this.parseElements('role', ClassicCaseRoleDefinition);
        // Clear our name and id element, so that caseteam definition is not accidentally found as a case role element
        this.name = '';
        this.id = '';
        this.isOldStyle = this.classicRoles.length > 0; // If we have found the <role> tag, then it is an old style model.
        this.caseTeamRef = this.parseReference('caseTeamRef');
    }

    get roles() {
        const team = this.caseTeamRef.getDefinition();
        if (team) {
            return team.roles;
        }
        return this.classicRoles;
    }

    createExportNode(parentNode: Element) {
        // Only export roles if isOldStyle
        const propertiesToExport = ['caseTeamRef', this.isOldStyle ? 'roles' : ''];
        super.createExportNode(parentNode, 'caseRoles', ...propertiesToExport);
    }
}
