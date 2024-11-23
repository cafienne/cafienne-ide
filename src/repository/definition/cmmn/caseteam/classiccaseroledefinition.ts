import CaseRoleDefinition from "@repository/definition/caseteam/caseroledefinition";
import CaseDefinition from "../casedefinition";
import CaseTeamDefinition from "./caseteamdefinition";

export default class ClassicCaseRoleDefinition extends CaseRoleDefinition<CaseDefinition> {
    constructor(importNode: Element, public caseDefinition: CaseDefinition, parent: CaseTeamDefinition) {
        super(importNode, caseDefinition, parent);
    }
}
