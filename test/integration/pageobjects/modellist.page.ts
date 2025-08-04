import CaseModelerPage from './casemodeler.page';
import CreateNewCaseDialog from './createnewcasedialog.page';
import CreateNewModelDialog from './createnewmodeldialog.page';

export type ModelType = 'case' | 'process' | 'humantask' | 'type';

export class ModelListPanel {
    modelTab(modelFileName: string) {
        return this.modelTabBase.$(`div[filename='${modelFileName}']`)
    }
    private get modelTabBase() {
        return $('.divModelList .divAccordionList');
    }

    public async selectModelTab(tabName: ModelType) {
        await this.modelTabBase.$(`h3[filetype='${tabName}']`).click();
    }

    public async getModel(type: ModelType, name: string) {
        await this.selectModelTab(type);
        return this.modelTabBase.$(`div[filename='${name}.${type}']`);
    }

    public async openCaseModel(modelName: string) {
        await (await (this.getModel('case', modelName))).click();
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

    async createHumantaskModel(name: string) {
        await this.createModelOfType('humantask', name);
    }

    async createProcessModel(name: string) {
        await this.createModelOfType('process', name);
    }

    async createTypeModel(name: string) {
        await this.createModelOfType('type', name);
    }

    async createModelOfType(type: ModelType, name: string) {
        await this.selectModelTab(type);

        await this.addModelButton(type).click();
        await CreateNewModelDialog.nameInput.addValue(name);
        await CreateNewModelDialog.confirm();

        await this.modelTabBase.$(`div[filename='${name}.${type}']`).waitForDisplayed();
    }

    public get repositoryPanel() {
        return $('.divModelList');
    }

    addModelButton(type: ModelType) {
        return this.repositoryPanel.$(`[filetype="${type}"] .plus-icon`);
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
