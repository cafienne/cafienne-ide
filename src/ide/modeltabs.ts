import $ from "jquery";

import IDE from "./ide";
import ModelEditor from "./modeleditor/modeleditor";

export default class ModelTabs {
    modelTabs: JQuery<HTMLElement>;
    tabList: ModelTab[] = [];
    /**
     * Constructs the footer of the IDE element.
     */
    constructor(public ide: IDE) {
        this.ide = ide;

        // Now set the pointers on the this object;
        this.modelTabs = this.ide.main.modelTabs;
    }

    addTab(editor: ModelEditor) {
        const existingTab = this.tabList.find(tab => tab.editor === editor);
        if (existingTab) {
            this.markSelectedTab(existingTab);
            return;
        }

        const tab = new ModelTab(editor, this);

        this.modelTabs.append(tab.html);
        this.tabList.push(tab);
        this.markSelectedTab(tab);
    }

    selectTab(tab: ModelTab) {
        this.markSelectedTab(tab);
        this.ide.editorRegistry.open(tab.editor.fileName)
    }

    private markSelectedTab(tab: ModelTab) {
        this.tabList.forEach(t => t.html.removeClass('active'));
        tab.html.addClass('active');
    }

    removeTab(editor: ModelEditor) {
        const tab = this.tabList.find(tab => tab.editor === editor);
        if (tab) {
            tab.html.remove();
            this.tabList = this.tabList.filter(t => t !== tab);
        }
    }
}

class ModelTab {
    html: JQuery<HTMLElement>;
    constructor(public editor: ModelEditor, public tabContainer: ModelTabs) {
        this.html = $(
            `<div class="model-tab" id="modelTab_${editor.fileName}">
                <label class="modelLabel">${editor.fileName}</label>
            </div>`
        );

        this.html.on('click', '.modelLabel', (e: JQuery.ClickEvent) => { this.tabContainer.selectTab(this); e.preventDefault(); });
    }
}
