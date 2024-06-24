import MappingRow from "../mappingrow";

export default class OperationSelector {
    static get label() {
        return 'Operation';
    }

    static get width() {
        return '65px';
    }

    static get tooltip() {
        return `Operation to be performed on the Case File Item
- Update (default): merges the task output into the case file
- Add (default on arrays): adds the output to the case file item array
- Replace: replace the content of the case file with the task output
- Update-Indexed: updates the task output into the case file item's selected array element based on the index of the current repeating plan item (or it's first found repeating parent)
- Replace-Indexed: similar to update-indexed, but then replaces the selected case file item

Note: if Update or Replace are selected on array type case file items,
the type of output (list or object) determines the behavior further`;
    }

    /**
     * 
     * @param {MappingRow} row 
     * @param {JQuery<HTMLTableCellElement>} column 
     */
    constructor(row, column) {
        const operation = row.element.taskParameter ? row.element.taskParameter.bindingRefinementExpression : '';
        const readOnly = operation ? '' : 'disabled';
        const options = ['', 'update', 'add', 'replace', 'update-indexed', 'replace-indexed'].map(op => `<option ${op === operation.toLowerCase() ? 'selected' : ''}>${op}</option>`).join('');
        column.html(`<div><select ${readOnly}>${options}</select></div>`).on('change', e => {
            if (row.element.taskParameter) {
                row.element.taskParameter.bindingRefinementExpression = $(e.target).val();
                row.case.editor.completeUserAction();
                row.editor.renderTable();    
            }
        })
    }
}
