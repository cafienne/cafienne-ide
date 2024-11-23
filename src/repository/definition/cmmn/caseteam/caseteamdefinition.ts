import CaseTeamModelDefinition from "../../../../repository/definition/caseteam/caseteammodeldefinition";
import CaseTeamRoleDefinition from "../../../../repository/definition/caseteam/caseteamroledefinition";
import ExternalReference from "../../../../repository/definition/references/externalreference";
import { Element } from "../../../../util/xml";
import CMMNElementDefinition from "../../cmmnelementdefinition";
import UnnamedCMMNElementDefinition from "../../unnamedcmmnelementdefinition";
import CaseDefinition from "../casedefinition";
import CaseRoleDefinition from "./caseroledefinition";

export default class CaseTeamDefinition extends UnnamedCMMNElementDefinition {
    isOldStyle: boolean;
    caseTeamRef: ExternalReference<CaseTeamModelDefinition>;
    roles: CaseRoleDefinition[];
    constructor(importNode: Element, caseDefinition: CaseDefinition, parent: CMMNElementDefinition) {
        super(importNode, caseDefinition, parent);
        /** @type {Array<CaseRoleDefinition>} */
        this.roles = this.parseElements('role', CaseRoleDefinition);
        // Clear our name and id element, so that caseteam definition is not accidentally found as a case role element
        this.name = '';
        this.id = '';
        this.isOldStyle = this.roles.length > 0; // If we have found the <role> tag, then it is an old style model.
        this.caseTeamRef = this.parseReference('caseTeamRef');
    }

    resolvedExternalReferences() {
        console.log("RESOLVED REFERENCES OF CASE TEAM: Pushing Roles");
        this.caseTeamRef.getDefinition()?.roles.forEach(role => this.addRole(role));
    }

    addRole(role: CaseTeamRoleDefinition) {
        this.roles.push(new CaseRoleDefinition(this.importNode, this.caseDefinition, this, role));
    }

    createExportNode(parentNode: Element) {
        // Only export roles if isOldStyle
        const propertiesToExport = ['caseTeamRef', this.isOldStyle ? 'roles' : ''];
        super.createExportNode(parentNode, 'caseRoles', ...propertiesToExport);
    }
}
