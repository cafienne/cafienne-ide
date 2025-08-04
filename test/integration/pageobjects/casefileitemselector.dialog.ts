export class CaseFileItemSelectorDialog {
    private locatorXP(postfix: string) {
        return $(`//dialog[form[@class = "cfi-selector"]]${postfix}`);
    }

    get confirmButton() {
        return this.locatorXP('//input[@type="submit"]');
    }
    get cancelButton() {
        return this.locatorXP('//button[@class="buttonCancel"]');
    }

    item(name: string) {
        return this.locatorXP(`//div[@class="cfi-summary" and text()[contains(normalize-space(.),'${name}')]]`);
    }
}

export default new CaseFileItemSelectorDialog();
