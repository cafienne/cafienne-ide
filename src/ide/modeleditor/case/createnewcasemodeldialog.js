import Dialog from "@ide/editors/dialog";
import IDE from "@ide/ide";
import $ from "jquery";
import TypeSelector from "../type/editor/typeselector";

export default class CreateNewCaseModelDialog extends Dialog {
    /**
     * @param {IDE} ide
     * @param {string} label
     * @param {string} defaultName
     */
    constructor(ide, label, defaultName = '') {
        super(ide, label);
        this.defaultName = defaultName;
        /** @type {string} */
        this.typeRef = this.defaultName ? this.defaultName + '.type' : '';
    }

    get name() {
        return this.dialogHTML.find('.inputName').val();
    }

    get description() {
        return this.dialogHTML.find('.inputDescription').val();
    }

    renderDialog() {
        const htmlDialog = $(`
            <form>
                <label style="width:150px">Name</label><input class = "inputName" value="${this.defaultName}">
                <br>
                <label style="width:150px">Description</label><input class = "inputDescription"/>
                <br>
                <label style="width:150px">Use Type</label><select class="selectType"></select>
                <br>
                <br>
                <input style="background-color:steelblue; color:#fff" type="submit" class='buttonOk' value="OK"/>
                <button class='buttonCancel'>Cancel</button>
            </form>
        `);
        this.dialogHTML.append(htmlDialog);
        this.dialogHTML.find('input').on('focus', e => e.target.select());
        this.dialogHTML.find('.inputName').on('change', e => {
            this.typeRef = /** @type {string} */ (this.name);
            console.log(`this.typeRef ${this.typeRef}/ this.name`);
            this.typeSelector.listRefresher(this.typeRef, [{option: `&lt;new&gt; ${this.typeRef}.type`, value: this.typeRef}]);
            this.dialogHTML.find('.selectType').val(this.typeRef);
        });
        this.dialogHTML.find('.buttonOk').on('click', e => this.closeModalDialog({ name: this.name, description: this.description, typeRef: this.typeRef }));
        this.dialogHTML.find('.buttonCancel').on('click', e => this.closeModalDialog(false));
        this.typeSelector = new TypeSelector(this.ide.repository, this.dialogHTML.find('.selectType'), this.typeRef, v => this.typeRef = v, false, [{option: `&lt;new&gt; ${this.typeRef}.type`, value: this.typeRef + '.type'}]);
    }
}
