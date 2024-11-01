import { ParameterRow } from "./caseparameterseditor";

export default class CFIZoom {
    static get label() {
        return 'Case File Item';
    }

    static get width() {
        return '150px';
    }

    static get tooltip() {
        return ;
    }

    /**
     * 
     * @param {ParameterRow} row 
     * @param {JQuery<HTMLTableCellElement>} column 
     */
    constructor(row, column) {
        const td = column.html(
            `<div class="cfiZoom">
                <label class="cfiName" title="Drag/drop a case file item to link it to this parameter">${row.bindingName}</label>
                <button class="removeReferenceButton" title="remove the reference to the case file item" />
            </div>`);

        // BindingRef event handlers
        td.on('pointerover', e => {
            e.stopPropagation();
            row.case.cfiEditor.setDropHandler(dragData => row.changeBindingRef(dragData.item));
        });
        td.on('pointerleave', e => {
            row.case.cfiEditor.removeDropHandler();
        });
        td.find('.removeReferenceButton').on('click', e => {
            row.change('bindingRef', undefined)
            td.find('.cfiName').html(row.parameter.bindingName);
        });
    }
}