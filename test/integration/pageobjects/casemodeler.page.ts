import IDEPage from './ide.page';

export class CaseModelerPage {
    public get shapebox() {
        return IDEPage.currentModelEditor.$(".shapebox");
    }

    private get caseModel() {
        return IDEPage.currentModelEditor.$('[data-type="CasePlanView"]');
    }

    private async haloItem(title: string) {
        await this.caseModel.moveTo();

        return IDEPage.currentModelEditor.$(`.haloitem[title="${title}"]`)
    }

    public async rolesHalo() {
        return await this.haloItem("Edit case team");
    } 

    async openRoleEditor() {
        await (await this.rolesHalo()).click();
    }
}

export default new CaseModelerPage();
