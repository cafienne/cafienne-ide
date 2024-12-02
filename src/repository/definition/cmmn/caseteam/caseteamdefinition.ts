import CMMNElementDefinition from "@repository/definition/cmmnelementdefinition";
import UnnamedCMMNElementDefinition from "../../unnamedcmmnelementdefinition";
import CaseDefinition from "../casedefinition";
import CaseRoleDefinition from "./caseroledefinition";
import ValidationContext from "@repository/validate/validation";

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
    validate(validationContext: ValidationContext) {
        super.validate(validationContext);

        for (let role of this.roles) {
            role.validate(validationContext);
        }

        let duplicatesRoles = this.roles.filter((role, index) => this.roles.indexOf(role) !== index);
        if (duplicatesRoles.length > 0) {
            this.raiseError('The case team has duplicate roles', []);
        }
    }
}
