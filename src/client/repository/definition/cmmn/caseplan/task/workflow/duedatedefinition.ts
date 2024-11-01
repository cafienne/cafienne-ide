import ExpressionContainer from "@repository/definition/cmmn/expression/expressioncontainer";

export default class DueDateDefinition extends ExpressionContainer {
    static TAG = 'duedate';

    get expressionTagName() {
        return 'condition';
    }

    createExportNode(parentNode: Element) {
        super.createExportNode(parentNode, DueDateDefinition.TAG);
    }
}
