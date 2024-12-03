'use strict';

import $ from "jquery";
import TestcaseModelDefinition from "../../../repository/definition/testcase/testcasemodeldefinition";
import TestcaseFile from "../../../repository/serverfile/testcasefile";
import XML from "../../../util/xml";
import IDE from "../../ide";
import ModelEditor from "../modeleditor";
import ModelEditorMetadata from "../modeleditormetadata";
import ModelSourceEditor from "../xmleditor/modelsourceeditor";
import TestcaseModelEditorMetadata from "./testcasetaskmodeleditormetadata";

export default class TestcaseModelEditor extends ModelEditor {
    viewSourceEditor?: ModelSourceEditor;
    private _changed: any;
    private _currentAutoSaveTimer?: number;
    private _model?: TestcaseModelDefinition;
    static register() {
        ModelEditorMetadata.registerEditorType(new TestcaseModelEditorMetadata());
    }

    /** 
     * This editor handles process models; only validates the xml
     */
    constructor(ide: IDE, public file: TestcaseFile) {
        super(ide, file);
        this.generateHTML();
    }

    get label() {
        return 'Edit Process - ' + this.fileName;
    }

    /**
     * adds the html of the entire page
     */
    generateHTML() {
        const html = $(`
            <div class="basicbox model-source-tabs">
                <ul>
                    <li><a href="#sourceEditor">Source</a></li>
                </ul>
                <div class="model-source-editor" id="sourceEditor"></div>
            </div>
        `);

        this.htmlContainer.append(html);

        //add the tab control
        this.htmlContainer.find('.model-source-tabs').tabs({
            activate: (e: any, ui: any) => {
                if (ui.newPanel.hasClass('model-source-editor')) {
                    this.viewSourceEditor?.render(this.model?.toXMLString() || '');
                }
            }
        });

        //add the source part
        this.viewSourceEditor = new ModelSourceEditor(this.html.find('.model-source-tabs .model-source-editor'), this);
        this.viewSourceEditor?.render(this.model?.toXMLString() || '');
    }

    onEscapeKey(e: JQuery.KeyDownEvent) {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
            return;
        }
        this.close();
    }

    changeName(newName: string) {
        if (this.model) {
            this.model.name = newName;
            this.saveModel();
        }
    }

    changeDescription(newDescription: string) {
        if (this.model) {
            this.model.documentation.text = newDescription;
            this.saveModel();
        }
    }


    render() {
        if (!this.model) return;

        if (this.viewSourceEditor) {
            this.viewSourceEditor.render(this.model.toXMLString());
        }
        // Set the implementation content in the code mirror editor and
//        this.freeContentEditor.setValue(this.model.implementation.xml);
//        this.freeContentEditor.refresh();
    }

    completeUserAction() {
        this.saveModel();
    }

    /**
     * Sets or replaces the auto save timer (which runs 10 seconds after the last change)
     */
    _enableAutoSave() {
        // Set 'changed' flag.
        this._changed = true;

        // Remove any existing timers
        this._removeAutoSave();

        // Now add a new timer to go off in 10 seconds from now (if no other activity takes place)
        this._currentAutoSaveTimer = window.setTimeout(() => {
            if (this._changed) {
                this._validateAndSave();
            }
        }, 10000);
    }

    /**
     * Removes the auto save timer, if it is defined.
     */
    _removeAutoSave() {
        if (this._currentAutoSaveTimer) {
            window.clearTimeout(this._currentAutoSaveTimer);
        }
    }

    onHide() {
        this._removeAutoSave();
    }

    onShow() {
        //always start with editor tab
        this.html.find('.model-source-tabs').tabs('option', 'active', 0);
    }

    loadModel() {
        this._model = this.file.definition;
        this.render();
        this.visible = true;
    }

    /**
     * handle the change of the source (in 2nd tab)
     */
    loadSource(newSource: any) {
        this.file.source = newSource;
        this.file.parse();
        this.loadModel();
        this.saveModel();
    }

    saveModel() {
        // Remove 'changed' flag just prior to saving
        this._changed = false;
        this.file.source = this.model?.toXML();
        this.file.save();
    }

    get model() {
        return this._model;
    }

    //handle the change of process implementation
    _validateAndSave() {
        const xmlData = XML.loadXMLString(this.file.source);

        // Must be valid xml - and contain a root tag
        if (XML.hasParseErrors(xmlData) || xmlData.childNodes.length == 0) {
            this.ide.danger('XML is invalid or missing, model will not be saved');
            return;
        }


        this.saveModel();
    }
}
