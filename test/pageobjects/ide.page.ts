import { $, expect } from '@wdio/globals';
import Page from "./page";

export class IDEPage extends Page {
    public get currentModelEditor() {
        return $(`.model-editor-base[style*="display: block;"]`);
    }
    public modelEditor(modelName: string) {
        return $(`.model-editor-base[model="${modelName}"]`);
    }
    public get modelList() {
        return $('.divModelList');
    }

    public async open(model?: string): Promise<void> {
        await super.open(model);
        await this.modelList.waitForDisplayed();
    }
    async expectWarning(message: string) {
        await expect($('.alert-danger')).toHaveText(expect.stringContaining(message));
    }
    async closeWarning() {
        await $('.messagebox button.close').click();
    }
}

export default new IDEPage();
