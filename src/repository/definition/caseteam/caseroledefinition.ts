import CaseTeamModelDefinition from "@repository/definition/caseteam/caseteammodeldefinition";
import DocumentableElementDefinition from "@repository/definition/documentableelementdefinition";
import ElementDefinition from "../elementdefinition";

export default class CaseRoleDefinition extends DocumentableElementDefinition<CaseTeamModelDefinition> {
    constructor(importNode: Element, caseDefinition: CaseTeamModelDefinition, parent?: ElementDefinition<CaseTeamModelDefinition>) {
        super(importNode, caseDefinition, parent);
    }
    
    static get prefix(): string {
        return 'cr';
    }

    createExportNode(parentNode: Element) {
        super.createExportNode(parentNode, 'role');
    }
}
