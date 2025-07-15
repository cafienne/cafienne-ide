import CaseTeamModelDefinition from "../../../../repository/definition/caseteam/caseteammodeldefinition";
import ExternalReference from "../../../../repository/definition/references/externalreference";
import XML, { Element } from "../../../../util/xml";
import Validator from "../../../validate/validator";
import CaseTeamRoleDefinition from "../../caseteam/caseteamroledefinition";
import CMMNElementDefinition from "../../cmmnelementdefinition";
import UnnamedCMMNElementDefinition from "../../unnamedcmmnelementdefinition";
import CaseDefinition from "../casedefinition";
import CaseRoleDefinition from "./caseroledefinition";
import ExternalCaseRoleDefinition from "./externalcaseroledefinition";

export default class CaseTeamDefinition extends UnnamedCMMNElementDefinition {
    caseTeamRef: ExternalReference<CaseTeamModelDefinition>;
    roles: CaseRoleDefinition[];
    private _isOldStyle: boolean;
    constructor(importNode: Element, caseDefinition: CaseDefinition, parent: CMMNElementDefinition) {
        super(importNode, caseDefinition, parent);
        /** @type {Array<CaseRoleDefinition>} */
        this.roles = this.parseElements('role', CaseRoleDefinition, []);
        // Clear our name and id element, so that caseteam definition is not accidentally found as a case role element
        this.name = '';
        this.id = '';
        this.caseTeamRef = this.parseReference('caseTeamRef');
        this._isOldStyle = this.caseTeamRef.isEmpty && this.roles.length > 0;
    }

    resolvedExternalReferences() {
        // If we refer to an external case team, we need to load their roles, but doing so in a wrapper class.
        this.caseTeamRef.getDefinition()?.roles.forEach(role => this.roles.push(new ExternalCaseRoleDefinition(this.importNode, this.caseDefinition, this, role)));
    }

    get documentation() {
        if (this.caseTeamRef.getDefinition()) {
            return this.caseTeamRef.getDefinition()!.documentation;
        }
        return super.documentation;
    }

    adopt(role: CaseTeamRoleDefinition) {
        const teamRole = new ExternalCaseRoleDefinition(this.importNode, this.caseDefinition, this, role);
        this.roles.push(teamRole);
        return teamRole;
    }

    createRole() {
        if (this.isOldStyle) {
            const role: CaseRoleDefinition = super.createDefinition(CaseRoleDefinition);
            this.roles.push(role);
            return role;
        } else {
            const team = this.caseTeamRef.getDefinition();
            if (team) {
                return this.adopt(team.createCaseRole());
            } else {
                throw new Error('Cannot create a role in a case team without a definition');
            }
        }
    }

    hasRole(role: CaseRoleDefinition): boolean {
        return this.roles.some(existingRole => existingRole.id === role.id);
    }

    changeCaseTeam(newCaseTeamRef: string) {
        this.caseTeamRef.update(newCaseTeamRef);
        // Clear existing roles and adopt roles from the new case team
        this.roles = [];
        this.caseTeamRef.getDefinition()?.roles.forEach(role => this.adopt(role));
        // For sure this is no longer an old style case team
        this._isOldStyle = false;
    }

    get isOldStyle() {
        return this._isOldStyle;
    }

    validate(validator: Validator) {
        super.validate(validator);
        const roleNames = this.roles.map(role => role.name);
        const rolesWithoutName = roleNames.filter(roleName => roleName.trim().length === 0);
        if (rolesWithoutName.length > 0) {
            validator.raiseError(this, `The case team has ${rolesWithoutName.length} role(s) without a name`);
        }
        const set: Set<string> = new Set(roleNames);
        if (set.size !== roleNames.length) {
            const duplicates = [...set].filter(uniqueName => roleNames.filter(name => name === uniqueName).length > 1).filter(name => name.trim().length > 0);
            validator.raiseError(this, `The case team has ${duplicates.length} duplicate role names: ${duplicates.join(', ')}`);
        }
    }

    createExportNode(parentNode: Element) {
        super.createExportNode(parentNode, 'caseRoles', 'caseTeamRef', 'roles');
        if (!this.isOldStyle) {
            // If we're in new style, we should drop all children (roles and documentation, mostly)
            XML.children(this.exportNode).forEach(c => this.exportNode.removeChild(c));
        }
    }
}
