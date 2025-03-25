import { Element } from "../../../../util/xml";
import Validator from "../../../validate/validator";
import CMMNElementDefinition from "../../cmmnelementdefinition";
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
        super.createExportNode(parentNode, 'caseRoles', 'roles');
    }
}
