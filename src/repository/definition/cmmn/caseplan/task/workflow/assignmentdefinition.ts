import CaseDefinition from "@repository/definition/cmmn/casedefinition";
import ExpressionContainer from "@repository/definition/cmmn/expression/expressioncontainer";
import CMMNElementDefinition from "@repository/definition/cmmnelementdefinition";

export default class AssignmentDefinition extends ExpressionContainer {
    static TAG = 'assignment';

    constructor(importNode: Element, caseDefinition: CaseDefinition, public parent: CMMNElementDefinition) {
        super(importNode, caseDefinition, parent);
    }

    get expressionTagName() {
        return 'condition';
    }

    createExportNode(parentNode: Element) {
        super.createExportNode(parentNode, AssignmentDefinition.TAG);
    }
}
