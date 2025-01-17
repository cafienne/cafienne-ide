import CaseDefinition from "../../../../cmmn/casedefinition";
import ExpressionContainer from "../../../../cmmn/expression/expressioncontainer";
import CMMNElementDefinition from "../../../../cmmnelementdefinition";

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
