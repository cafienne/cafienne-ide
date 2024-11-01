import MappingRow from "../mappingrow";
import $ from "jquery";

export default class InputOperationSelector {
    static get label() {
        return 'Operation';
    }

    static get width() {
        return '45px';
    }

    static get tooltip() {
        return `Operation to select the right the Case File Item
- Current (default): takes the last modified item in a case file item array
- List: passes the entire case file item array
- Indexed: takes the item matching the index of the current repeating plan item (or first repeating parent)
- Reference: passes the path to the case file item
- Reference-Indexed: passes the path to the case file item, with index the index of the current repeating plan item (or first repeating parent) 

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
        const options = ['', 'current', 'list', 'indexed', 'reference', 'reference-indexed'].map(op => `<option ${op === operation.toLowerCase() ? 'selected' : ''}>${op}</option>`).join('');
        column.html(`<div><select ${readOnly}>${options}</select></div>`).on('change', e => {
            if (row.element.taskParameter) {
                row.element.taskParameter.bindingRefinementExpression = $(e.target).val();
                row.case.editor.completeUserAction();
                row.editor.renderTable();    
            }
        })
    }
}
