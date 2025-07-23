import IDEPage from './ide.page';

export class CaseTeamEditor {
    private get editor() {
        return IDEPage.currentModelEditor.$('.caseteam-editor');
    }

    public get teamSelect() {
        return this.editor.$('.selectTeam');
    }

    public get deleteButton() {
        return this.editor.$('.remove-team')
    }

    public get renameButton() {
        return this.editor.$('.rename-team')
    }

    async expectTeamSelected(teamName: string) {
        await expect(this.teamSelect).toHaveValue(teamName + ".caseteam");
    }

    async expectTeamNotSelected() {
        await expect(this.teamSelect).toHaveValue('');
    }
}

export default new CaseTeamEditor();
