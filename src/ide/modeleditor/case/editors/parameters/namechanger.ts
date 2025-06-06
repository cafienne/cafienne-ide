import $ from 'jquery';
import ParameterRow from "./parameterrow";

export default class NameChanger {
    static get label() {
        return 'Name';
    }

    static get width() {
        return '120px';
    }

    static get tooltip() {
        return 'Name of the parameter';
    }

    constructor(row: ParameterRow, column: JQuery<HTMLTableCellElement>) {
        const nameInput = $(`<input class="parameter-name" type="text" value="${row.parameterName}" />`) as JQuery<HTMLInputElement>;
        column.append(nameInput);
        // Handle parameter name change
        nameInput.on('change', e => row.changeName(e.target.value));
    }
}
