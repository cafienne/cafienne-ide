import Images from "../../../../util/images/images";
import { ParameterRow } from "./caseparameterseditor";

export default class ParameterDeleter {
    static get label() {
        return '';
    }

    static get width() {
        return '20px'
    }

    static get tooltip() {
        return 'Delete the parameter';
    }

    /**
     * 
     * @param {ParameterRow} row 
     * @param {JQuery<HTMLTableCellElement>} column 
     */
    constructor(row, column) {
        const button = column.html(`<button class="btnDelete"><img src="${Images.Delete}" /></button>`);
        button.on('click', () => {
            row.parameter.removeDefinition();
            row.case.editor.completeUserAction();
            row.control.renderTable();
        });
    }
}
