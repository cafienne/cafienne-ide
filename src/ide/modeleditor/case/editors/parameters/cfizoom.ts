import ParameterRow from "./parameterrow";

export default class CFIZoom {
    static get label() {
        return 'Case File Item';
    }

    static get width() {
        return '150px';
    }

    static get tooltip() {
        return '';
    }

    constructor(row: ParameterRow, column: JQuery<HTMLTableCellElement>) {
        const td = column.html(
            `<div class="cfiZoom">
                <label class="cfiName" title="Drag/drop a case file item to link it to this parameter">${row.bindingName}</label>
                <button class="zoombt"></button>
                <button class="removeReferenceButton" title="remove the reference to the case file item"></button>
            </div>`);

        // BindingRef event handlers
        td.on('pointerover', e => {
            e.stopPropagation();
            row.case.cfiEditor.setDropHandler(dragData => row.changeBindingRef(dragData.item));
        });
        td.on('pointerleave', e => {
            row.case.cfiEditor.removeDropHandler();
        });
        td.find('.zoombt').on('click', e => row.case.cfiEditor.open(cfi => row.changeBindingRef(cfi)));
        td.find('.removeReferenceButton').on('click', e => {
            row.change('bindingRef', undefined)
            td.find('.cfiName').html(row.parameter.bindingName);
        });
    }
}
