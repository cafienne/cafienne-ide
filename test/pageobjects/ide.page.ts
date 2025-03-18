import { $ } from '@wdio/globals';
import Page from "./page";

export class IDEPage extends Page {
    public modelEditor(modelName: string) {
        return $(`.model-editor-base[model="${modelName}"]`);
    }
    public get modelList () {
        return $('.divModelList');
    }
}

export default new IDEPage();
