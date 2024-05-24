export default class Dialog {
    /**
     * @param {IDE} ide
     * @param {string} label
     */
    constructor(ide, label) {
        this.ide = ide;
        this.label = label;
    }

    /**
     * 
     * @param {Function} callback 
     */
    showModalDialog(callback) {
        this.renderHeader();
        this.renderDialog();
        this.callback = callback;
        const dialogHTML = this.dialogHTML[0]; // Save DOM pointer to HTMLElement (not jQuery as we don't have the showModal native method available in jQuery API)
        dialogHTML.showModal();

        // Normalize left/top style to absolute values to make it draggable with jQuery draggable
        // By default a modal <dialog> is positioned in the center of viewport using a margin style. This should be disabled setting margin to 0px;
        const cs = getComputedStyle(dialogHTML);
        const left = cs.marginLeft;
        const top = cs.marginTop;
        dialogHTML.style.margin= '0px';
        dialogHTML.style.left = left;
        dialogHTML.style.top = top;
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
            this.dialogHTML.on('selectstart', e => e.preventDefault());
        }
        return this.dialogHTML;
    }

    get label() {
        return this._label;
    }

    set label(sLabel) {
        this._label = sLabel;
        if (this.dialogHTML) this.dialogHTML.find('.dialogLabel').html(sLabel);
    }

    /** @param {any} returnValue */
    closeModalDialog(returnValue) {
        if (this.callback) this.callback(returnValue);
        Util.removeHTML(this.dialogHTML);
    }

    renderDialog() {
        const htmlDialog = $(`<div>
                <button class='buttonOk'>OK</button>
                </div>`);
        this.dialogHTML.append(htmlDialog);
        htmlDialog.find('.buttonOk').on('click', e => this.closeModalDialog('Ok'));
    }
}
