import Dialog from "./editors/dialog";
import IDE from "@ide/ide";
import $ from "jquery";

export default class CreateNewModelDialog extends Dialog {
    defaultName: string;
    constructor(ide: IDE, label: string, defaultName: string = '') {
        super(ide, label);
        this.defaultName = defaultName;
    }

    get name() {
        return this.dialogHTML?.find('.inputName').val();
    }

    get description() {
        return this.dialogHTML?.find('.inputDescription').val();
    }

    renderDialog() {
        const htmlDialog = $(`
            <form>
                <label style="width:150px">Name</label><input class = "inputName" value="${this.defaultName}">
                <br>
                <label style="width:150px">Description</label><input class = "inputDescription"/>
                <br>
                <br>
                <input style="background-color:steelblue; color:#fff" type="submit" class='buttonOk' value="OK"/>
                <button class='buttonCancel'>Cancel</button>
            </form>
        `);
        this.dialogHTML?.append(htmlDialog);
        this.dialogHTML?.find('input').on('focus', e => e.target.select());
        this.dialogHTML?.find('.buttonOk').on('click', e => this.closeModalDialog({ name: this.name, description: this.description }));
        this.dialogHTML?.find('.buttonCancel').on('click', e => this.closeModalDialog(false));
    }
}
