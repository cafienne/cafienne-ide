import Dialog from "./editors/dialog";
import IDE from "@ide/ide";
import $ from "jquery";

type NewModelResult = {
    name: string,
    description: string
}

export default class CreateNewModelDialog extends Dialog {
    constructor(ide: IDE, label: string) {
        super(ide, label);
    }

    renderDialog(dialogHTML: JQuery<HTMLElement>) {
        const htmlDialog = $(`
            <form>
                <label style="width:150px">Name</label><input class = "inputName" value="">
                <br>
                <label style="width:150px">Description</label><input class = "inputDescription"/>
                <br>
                <br>
                <input style="background-color:steelblue; color:#fff" type="submit" class='buttonOk' value="OK"/>
                <button class='buttonCancel'>Cancel</button>
            </form>
        `);
        dialogHTML.append(htmlDialog);
        dialogHTML.find('input').on('focus', e => e.target.select());
        dialogHTML.find('.buttonOk').on('click', e => this.closeModalDialog(this.readResult(dialogHTML)));
        dialogHTML.find('.buttonCancel').on('click', e => this.closeModalDialog(false));
    }

    readResult(dialogHTML: JQuery<HTMLElement>): NewModelResult {
        const name: string = '' + dialogHTML.find('.inputName').val();
        const description: string = '' + dialogHTML.find('.inputDescription').val();
        return { name, description }
    }
}
