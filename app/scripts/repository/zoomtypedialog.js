class ZoomTypeDialog extends Dialog {
    /**
     * @param {CaseTypeEditor} editor
     */
    constructor(editor) {
        super(editor.ide, 'Select an item');
        this.case = editor.case;
        /** @type {CaseFileItemDef} */
        this.selectedItem = undefined;
    }

    renderDialog() {
        const htmlDialog = $(`
            <form class="zoomtypedialog">
                <div class="typeschemacontainer">
                </div>
                <br/>
                <input type="submit" class='buttonOk' value="OK"/>
                <button class='buttonCancel'>Cancel</button>
            </form>
        `);
        this.dialogHTML.append(htmlDialog);
        this.case.caseDefinition.caseFile.children.forEach(cfi => this.renderCaseFileItem(cfi, this.dialogHTML.find('.typeschemacontainer')));
        this.dialogHTML.find('.buttonOk').on('click', e => this.ok());
        this.dialogHTML.find('.buttonCancel').on('click', e => this.cancel());
    }

    /**
     * 
     * @param {CaseFileItemDef} item 
     * @param {JQuery<HTMLElement>} container
     */
    renderCaseFileItem(item, container) {
        const html = $(
        `<div class='propertycontainer'>
            <div class='schema-property-item'>
                <img class="schemaPropertyIcon" style="width:14px;margin:2px" src="/images/svg/casefileitem.svg"/>
                ${item.name}
            </div>
            <div style="padding-left: 16px" class="propertyschemacontainer schemacontainer"></div>
        </div>`);
        container.append(html);
        html.find('.schema-property-item').on('click', e => {
            this.dialogHTML.find('.propertyselected').removeClass('propertyselected');
            this.selectedItem = item;
            $(e.target).addClass('propertyselected');
        });
        html.find('.schema-property-item').on('dblclick', e => {
            this.ok();
        });
        const schemaContainer = html.find('>.schemacontainer');
        item.children.forEach(cfi => this.renderCaseFileItem(cfi, schemaContainer));
    }

    ok() {
        super.closeModalDialog(this.selectedItem);
    }

    cancel() {
        super.closeModalDialog(undefined);
    }
}
