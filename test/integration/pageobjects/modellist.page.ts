import CaseModelerPage from './casemodeler.page';
import CreateNewCaseDialog from './createnewcasedialog.page';
import CreateNewModelDialog from './createnewmodeldialog.page';

export class ModelListPanel {
    private get modelTabBase() {
        return $('.divModelList .divAccordionList');
    }

    public async selectModelTab(tabName: string) {
        await this.modelTabBase.$(`h3[filetype='${tabName}']`).click();
    }

    public async openModel(modelName: string) {
        await this.modelTabBase.$(`div[filename='${modelName}']`).click();
    }


    public async createCaseModel(caseName: string, teamName?: string) {
        await this.selectModelTab('case');
        await this.addCaseButton.click();
        await CreateNewCaseDialog.nameInput.addValue(caseName);
        await browser.keys('\t'); // now other fields get filled.

        if (teamName) {
            await CreateNewCaseDialog.teamSelect.selectByAttribute('value', teamName + ".caseteam");
        }

        await CreateNewCaseDialog.confirm();

        await this.modelTabBase.$(`div[filename='${caseName}.case']`).waitForDisplayed();

        await CaseModelerPage.shapebox.waitForDisplayed();
    }

    async createProcessModel(name: string) {
        await this.selectModelTab('process');
        await this.addProcessButton.click();
        await CreateNewModelDialog.nameInput.addValue(name);
        await browser.keys('\t'); // now other fields get filled.

        await CreateNewModelDialog.confirm();

        await this.modelTabBase.$(`div[filename='${name}.process']`).waitForDisplayed();
    }

    async createTypeModel(name: string) {
        await this.selectModelTab('process');
        await this.addTypeButton.click();
        await CreateNewModelDialog.nameInput.addValue(name);
        await browser.keys('\t'); // now other fields get filled.

        await CreateNewModelDialog.confirm();

        await this.modelTabBase.$(`div[filename='${name}.type']`).waitForDisplayed();
    }

    public get repositoryPanel() {
        return $('.divModelList');
    }
    public get addCaseButton() {
        return this.repositoryPanel.$('[filetype="case"] .plus-icon');
    }

    public get addProcessButton() {
        return this.repositoryPanel.$('[filetype="process"] .plus-icon');
    }

    public get addTypeButton() {
        return this.repositoryPanel.$('[filetype="type"] .plus-icon');
    }
}

export default new ModelListPanel();
