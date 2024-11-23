import CaseTeamModelDefinition from "@repository/definition/caseteam/caseteammodeldefinition";
import CMMNElementDefinition from "@repository/definition/cmmnelementdefinition";
import ExternalReference from "@repository/definition/externalreference";
import UnnamedCMMNElementDefinition from "../../unnamedcmmnelementdefinition";
import CaseDefinition from "../casedefinition";
import ClassicCaseRoleDefinition from "./classiccaseroledefinition";

export default class CaseTeamDefinition extends UnnamedCMMNElementDefinition {
    isOldStyle: boolean;
    caseTeamRef: ExternalReference<CaseTeamModelDefinition>;
    roles: ClassicCaseRoleDefinition[];
    constructor(importNode: Element, caseDefinition: CaseDefinition, parent: CMMNElementDefinition) {
        super(importNode, caseDefinition, parent);
        /** @type {Array<ClassicCaseRoleDefinition>} */
        this.roles = this.parseElements('role', ClassicCaseRoleDefinition);
        // Clear our name and id element, so that caseteam definition is not accidentally found as a case role element
        this.name = '';
        this.id = '';
        this.isOldStyle = this.roles.length > 0; // If we have found the <role> tag, then it is an old style model.
        this.caseTeamRef = this.parseReference('caseTeamRef');
    }

    createExportNode(parentNode: Element) {
        // Only export roles if caseTeamRef is empty
        const propertiesToExport = ['caseTeamRef', this.caseTeamRef ? '' : 'roles'];
        super.createExportNode(parentNode, 'caseRoles', ...propertiesToExport);
    }
}
