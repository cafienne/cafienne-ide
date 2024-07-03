import CaseFileItemDef from "@definition/cmmn/casefile/casefileitemdef";
import Dialog from "@ide/editors/dialog";
import CaseView from "../../elements/caseview";
import $ from "jquery";

export default class CFISelector extends Dialog {
    /**
     * @param {CaseView} cs
     */
    constructor(cs) {
        super(cs.editor.ide, 'Select a Case File Item');
        this.case = cs;
        /** @type {CaseFileItemDef} */
        this.selectedItem = undefined;
    }

    renderDialog() {
        const htmlDialog = $(`
            <form class="cfi-selector">
                <div class="cfi-tree"></div>
                <br/>
                <input type="submit" class='buttonOk' value="OK"/>
                <button class='buttonCancel'>Cancel</button>
            </form>
        `);
        this.dialogHTML.append(htmlDialog);
        this.case.caseDefinition.caseFile.children.forEach(cfi => this.renderCaseFileItem(cfi, this.dialogHTML.find('.cfi-tree')));
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
        `<div class='cfi-container'>
            <div class='cfi-summary'>
                <img class="cfi-icon" src="/images/svg/casefileitem.svg" />
                ${item.name}
            </div>
            <div class="cfi-children-tree"></div>
        </div>`);
        container.append(html);
        html.find('.cfi-summary').on('click', e => {
            this.dialogHTML.find('.cfi-selected').removeClass('cfi-selected');
            this.selectedItem = item;
            $(e.target).addClass('cfi-selected');
        });
        html.find('.cfi-summary').on('dblclick', e => {
            this.ok();
        });
        const divChildren = html.find('.cfi-children-tree');
        item.children.forEach(cfi => this.renderCaseFileItem(cfi, divChildren));
    }

    ok() {
        super.closeModalDialog(this.selectedItem);
    }

    cancel() {
        super.closeModalDialog(undefined);
    }
}
