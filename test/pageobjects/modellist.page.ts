import { $ } from '@wdio/globals';

export class ModelListPanel  {
    private get modelTabBase () {
        return $('.divModelList .divAccordionList');
    }

    public async selectModelTab (tabName: string) {
        await this.modelTabBase.$(`h3[filetype='${tabName}']`).click();
    }

    public async openModel (modelName: string) {
        await this.modelTabBase.$(`div[filename='${modelName}']`).click();
    }

    public get repositoryPanel () {
        return $('.divModelList');
    }
}

export default new ModelListPanel();
