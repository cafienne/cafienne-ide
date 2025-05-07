export class NewModelDialog {
    protected get dialogBase () {
        return $('dialog');
    }

    public async confirm () {
        await this.dialogBase.$(`.buttonOk`).click();
    }

    public async candel () {
        await this.dialogBase.$(`.buttonCancel`).click();
    }

    public get nameInput () {
        return this.dialogBase.$('.inputName');
    }
    public get descriptionInput () {
        return this.dialogBase.$('.inputDescription');
    }
}

export default new NewModelDialog();
