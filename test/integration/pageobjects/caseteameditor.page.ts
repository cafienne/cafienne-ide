import IDEPage from './ide.page';

export class CaseTeamEditor {
    async close() {
        await this.locator('.formheader .formclose').click();
    }
    async addRole(name: string, documentation?: string) {
        const numberOfRows = await this.locators('.formbody > .formcontainer > .caseteam-grid').length;
        const lastRow = this.locator(`.formbody > .formcontainer > .caseteam-grid:nth-child(${numberOfRows})`);

        await lastRow.$('.inputRoleName').addValue(name);
        if (documentation) {
            await lastRow.$('.inputDocumentation').addValue(documentation);
        }
        await browser.keys('\t');
    }
    public get teamSelect() {
        return this.locator('.selectTeam');
    }

    public get deleteButton() {
        return this.locator('.remove-team')
    }

    public get renameButton() {
        return this.locator('.rename-team')
    }

    async expectTeamSelected(teamName: string) {
        await expect(this.teamSelect).toHaveValue(teamName + ".caseteam");
    }

    async expectTeamNotSelected() {
        await expect(this.teamSelect).toHaveValue('');
    }

    private locator(postfix: string) {
        return IDEPage.currentModelEditor.$(`.caseteam-editor ${postfix}`);
    }
    private locators(postfix: string) {
        return IDEPage.currentModelEditor.$$(`.caseteam-editor ${postfix}`);
    }

}

export default new CaseTeamEditor();
