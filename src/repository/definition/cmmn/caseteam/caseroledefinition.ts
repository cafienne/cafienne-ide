import ValidationContext from "@repository/validate/validation";
import CMMNElementDefinition from "../../cmmnelementdefinition";
import CaseDefinition from "../casedefinition";
import CaseTeamDefinition from "./caseteamdefinition";

export default class CaseRoleDefinition extends CMMNElementDefinition {
    constructor(importNode: Element, caseDefinition: CaseDefinition, parent: CaseTeamDefinition) {
        super(importNode, caseDefinition, parent);
    }

    createExportNode(parentNode: Element) {
        super.createExportNode(parentNode, 'role');
    }
    validate(validationContext: ValidationContext) {
        super.validate(validationContext);

        if (this.name === "") 
        {
            this.raiseError('A case role has no name', []);
        }
    }
}