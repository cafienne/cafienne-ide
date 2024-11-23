import CaseTeamModelDefinition from "@repository/definition/caseteam/caseteammodeldefinition";
import DocumentableElementDefinition from "@repository/definition/documentableelementdefinition";
import CaseDefinition from "../cmmn/casedefinition";
import ElementDefinition from "../elementdefinition";

export default class CaseRoleDefinition<M extends CaseTeamModelDefinition | CaseDefinition> extends DocumentableElementDefinition<M> {
    constructor(importNode: Element, caseDefinition: M, parent?: ElementDefinition<M>) {
        super(importNode, caseDefinition, parent);
    }

    createExportNode(parentNode: Element) {
        super.createExportNode(parentNode, 'role');
    }
}
