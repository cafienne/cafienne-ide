import { Element } from "../../../util/xml";
import DocumentableElementDefinition from "../documentableelementdefinition";
import ElementDefinition from "../elementdefinition";
import CaseTeamModelDefinition from "./caseteammodeldefinition";

export default class CaseTeamRoleDefinition extends DocumentableElementDefinition<CaseTeamModelDefinition> {
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
