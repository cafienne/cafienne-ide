import ParameterRow from "./parameterrow";

export default class ExpressionChanger {
    static get label() {
        return 'Expression';
    }

    static get width() {
        return '';
    }

    constructor(row: ParameterRow, column: JQuery<HTMLTableCellElement>) {
        const div = column.html(
            `<div>
                <textarea>${row.expression}</textarea>
            </div>`);
        // Binding expression event handlers
        const textarea = div.find('textarea');
        textarea.on('change', e => {
            const newExpression = (e.target as HTMLTextAreaElement).value;
            if (newExpression) {
                row.parameter.getBindingRefinement().body = newExpression;
            } else {
                row.parameter.getBindingRefinement().removeDefinition();
            }
            row.case.editor.completeUserAction();
        });
    }
}
