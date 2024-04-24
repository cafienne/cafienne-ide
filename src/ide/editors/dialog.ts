import IDE from "@ide/ide";
import $ from "jquery";
import "jquery-ui";
import Util from "@util/util";

export default class Dialog {
    callback: Function | undefined;
    private dialogHTML?: JQuery<HTMLElement>;
    private _label: string | undefined;

    constructor(public ide: IDE, label: string) {
        this.label = label;
    }

    showModalDialog(callback: Function) {
        const dialogHTML = this.renderHeader();
        this.renderDialog(dialogHTML);
        this.callback = callback;
        if (this.dialogHTML) {
            const dialogHTML: HTMLDialogElement = this.dialogHTML[0] as HTMLDialogElement; // Save DOM pointer to HTMLElement (not jQuery as we don't have the showModal native method available in jQuery API)
            dialogHTML.showModal();

            // Normalize left/top style to absolute values to make it draggable with jQuery draggable
            // By default a modal <dialog> is positioned in the center of viewport using a margin style. This should be disabled setting margin to 0px;
            const cs = getComputedStyle(dialogHTML);
            const left = cs.marginLeft;
            const top = cs.marginTop;
            dialogHTML.style.margin = '0px';
            dialogHTML.style.left = left;
            dialogHTML.style.top = top;
        }
    }

    renderHeader() {
        if (!this.dialogHTML) {
            this.dialogHTML = $(`
            <dialog>
                <div class='dialogHeader'>
                    <label class="dialogLabel">${this.label}</label>
                </div>
                <br>
            </dialog>`);
            this.ide.html.append(this.dialogHTML);
            this.dialogHTML.draggable({ handle: '.dialogHeader' });
            this.dialogHTML.on('selectstart', (e: { preventDefault: () => any; }) => e.preventDefault());
        }
        return this.dialogHTML;
    }

    get label(): string | undefined {
        return this._label;
    }

    set label(sLabel) {
        this._label = sLabel;
        if (this.dialogHTML) this.dialogHTML.find('.dialogLabel').html(sLabel ? sLabel : '');
    }

    closeModalDialog(returnValue: any) {
        if (this.callback) this.callback(returnValue);
        if (this.dialogHTML) {
            Util.removeHTML(this.dialogHTML);
        }
    }

    renderDialog(dialogHTML: JQuery<HTMLElement>) {
        const htmlDialog = $(`<div>
                <button class='buttonOk'>OK</button>
                </div>`);
        dialogHTML.append(htmlDialog);
        htmlDialog.find('.buttonOk').on('click', e => this.closeModalDialog('Ok'));
    }
}
