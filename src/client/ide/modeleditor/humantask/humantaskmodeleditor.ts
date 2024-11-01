import HumanTaskModelDefinition from "@definition/humantask/humantaskmodeldefinition";
import IDE from "@ide/ide";
import RightSplitter from "@ide/splitter/rightsplitter";
import HumanTaskFile from "@repository/serverfile/humantaskfile";
import AlpacaPreview from "@util/alpacapreview";
import CodeMirrorConfig from "@util/codemirrorconfig";
import Util from "@util/util";
import XML from "@util/xml";
import $ from "jquery";
import ModelEditor from "../modeleditor";
import ModelEditorMetadata from "../modeleditormetadata";
import ModelParameters from "../xmleditor/modelparameters";
import ModelSourceEditor from "../xmleditor/modelsourceeditor";
import HumantaskModelEditorMetadata from "./humantaskmodeleditormetadata";

export default class HumantaskModelEditor extends ModelEditor {
    inputParametersControl: ModelParameters;
    outputParametersControl: ModelParameters;
    viewSourceEditor: ModelSourceEditor;
    freeContentEditor: any;
    private _changed: any;
    private _currentAutoSaveTimer?: number;
    private _model?: HumanTaskModelDefinition;
    contentViewer: JQuery<HTMLElement>;
    taskPreview: JQuery<HTMLElement>;
    taskPreviewErrors: JQuery<HTMLElement>;
    jsonErrorDiv: JQuery<HTMLElement>;

    static register() {
        ModelEditorMetadata.registerEditorType(new HumantaskModelEditorMetadata());
    }

    /**
     * This object handles human task models, includes ui-editor and source editor
     */
    constructor(ide: IDE, public file: HumanTaskFile) {
        super(ide, file);
        const html = $(`
            <div class="basicbox model-source-tabs">
                <ul>
                    <li><a href="#modelEditor">Editor</a></li>
                    <li><a href="#sourceEditor">Source</a></li>
                </ul>
                <div class="humantask-model-editor" id="modelEditor">
                    <div class="left-pane">
                        <div class="modelgenericfields">
                            <div>
                                <label>Name</label>
                                <label>Documentation</label>
                            </div>
                            <div>
                                <input class="inputName" type="text" />
                                <input class="inputDocumentation" type="text" />
                            </div>
                        </div>
                        <div class="model-parameters">
                            <div class="model-input-parameters"></div>
                            <div class="model-output-parameters"></div>
                        </div>
                        <div class="task-model-source">
                            <label>Task Model (JSON)</label>
                            <span class="json-error-description"></span>
                            <div class="code-mirror-source"></div>
                        </div>
                    </div>
                    <div>
                        <div class="model-content-viewer">
                            <div class="task-preview-header">
                                <h3>Preview</h3>
                                <label>Note: the preview below is rendered with <a target="_blank" href="http://www.alpacajs.org/">AlpacaJS</a>; Cafienne UI uses <b><a target="_new" href="https://react-jsonschema-form.readthedocs.io">React JSON Schema Forms</a></b>, which render slightly different.</label>
                                <br />
                                <label class="alpaca-error-description"></label>
                            </div>
                            <div class="task-preview-content"></div>
                        </div>
                    </div>
                </div>
                <div class="model-source-editor" id="sourceEditor"></div>
            </div>
        `);

        this.htmlContainer.append(html);

        //add change event to input fields
        this.htmlContainer.find('.inputName').on('change', (e: any) => this.changeName(e.currentTarget.value));
        this.htmlContainer.find('.inputDocumentation').on('change', (e: any) => this.changeDescription(e.currentTarget.value));

        new RightSplitter(this.htmlContainer.find('#modelEditor'), '675px');

        // Render input parameters
        this.inputParametersControl = new ModelParameters(this, this.html.find('.model-input-parameters'), 'Input Parameters');
        this.outputParametersControl = new ModelParameters(this, this.html.find('.model-output-parameters'), 'Output Parameters');

        //add the tab control
        this.htmlContainer.find('.model-source-tabs').tabs({
            activate: (e: any, ui: any) => {
                if (ui.newPanel.hasClass('model-source-editor')) {
                    this.viewSourceEditor.render(this.model?.toXMLString() || '');
                }
            }
        });


        // add the source part
        this.viewSourceEditor = new ModelSourceEditor(this.html.find('.model-source-tabs .model-source-editor'), this);
        this.contentViewer = this.html.find('.model-content-viewer');
        this.taskPreview = this.html.find('.task-preview-content');
        this.taskPreviewErrors = this.html.find('.alpaca-error-description');
        this.jsonErrorDiv = this.html.find('.json-error-description');
        this.createCodeMirrorEditor();
    }

    onEscapeKey(e: JQuery.KeyDownEvent) {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
            return;
        }
        this.close();
    }

    createCodeMirrorEditor() {
        //add code mirror JSON style
        this.freeContentEditor = CodeMirrorConfig.createJSONEditor(this.html.find('.code-mirror-source'));

        /* Events for saving and keeping track of changes in the task model editor
        The model should only be saved when there is a change and the codemirror is blurred.
        The onchange event of codemirror fires after every keydown, this is not wanted.
        So only save after blur, but only when there is a change in content.
        To avoid missing the blur event and therewith loosing work, 
        the editor automatically saves 10 seconds after last change.
        */
        // Add event handlers on code mirror to track changes
        this.freeContentEditor.on('focus', () => this._changed = false);
        this.freeContentEditor.on('blur', () => {
            if (this._changed) {
                this._removeAutoSave();
                this.saveModel();
            }
        });
        this.freeContentEditor.on('change', () => this.taskModelChanged());
    }

    changeName(newName: string) {
        if (this.model) {
            this.model.name = newName;
            this.saveModel();
        }
    }

    changeDescription(newDescription: string) {
        if (this.model) {
            this.model.implementation.documentation.text = newDescription;
            this.saveModel();
        }
    }

    render() {
        if (!this.model) return;
        if (!this.model.implementation) return;


        // Render name and description
        this.htmlContainer.find('.inputName').val(this.model.name);
        this.htmlContainer.find('.inputDocumentation').val(this.model.implementation.documentation.text);

        this.inputParametersControl.renderParameters(this.model.inputParameters);
        this.outputParametersControl.renderParameters(this.model.outputParameters);

        // Set the implementation content in the code mirror editor and
        this.freeContentEditor.setValue(this.model.implementation.taskModel.value);
        this.freeContentEditor.refresh();
        this.renderPreview();
    }

    renderPreview() {
        if (!this.model) return;
        if (!this.model.implementation) return;

        // Clear current content
        this.taskPreview.html('');
        this.taskPreviewErrors.html('');
        this.jsonErrorDiv.html('');

        // Now check if there is a "sensible" expectation that we have a JSON schema in the taskmodel
        const taskModel = this.model.implementation.taskModel.value;
        if (!taskModel || taskModel.trim().indexOf('{') < 0) {
            return;
        }

        const errorHandler = (e: any) => this.taskPreviewErrors.html(`Alpaca Error Message: ${e.message}`);

        const parseResult = Util.parseJSON(taskModel);
        if (parseResult.object) {
            const jsonForm = parseResult.object;
            jsonForm.options = {
                focus: false
            }
            jsonForm.error = errorHandler;
            // Render the task view
            new AlpacaPreview(this.taskPreview).render(jsonForm);
        } else {
            this.jsonErrorDiv.html(parseResult.description);
        }
    }

    /**
     * Sets or replaces the auto save timer (which runs 10 seconds after the last change)
     */
    taskModelChanged() {
        if (!this.model) return;
        if (!this.model.implementation) return;

        // Set 'changed' flag.
        this._changed = true;

        // Take latest and greatest json schema
        this.model.implementation.taskModel.value = this.freeContentEditor.getValue();

        this.renderPreview();
        this.setAutoSaveTimer();
    }

    setAutoSaveTimer() {
        // Remove any existing timers
        this._removeAutoSave();

        // Now add a new timer to go off in 10 seconds from now (if no other activity takes place)
        this._currentAutoSaveTimer = window.setTimeout(() => {
            if (this._changed) {
                this.saveModel();
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

    completeUserAction() {
        this.saveModel();
    }

    onHide() {
        this._removeAutoSave();
    }

    onShow() {
        //always start with editor tab
        this.html.find('.model-source-tabs').tabs('option', 'active', 0);
        //this refresh, is a workaround for defect in codemirror
        //not rendered properly when html is hidden
        setTimeout(() => this.freeContentEditor.refresh(), 100);
    }

    loadModel() {
        this._model = this.file.definition;
        this.render();
        this.visible = true;
    }

    /**
     * handle the change of the source (in 2nd tab)
     */
    loadSource(source: string) {
        this.file.source = source;
        this.loadModel();
        this.saveModel();
    }

    saveModel() {
        // Remove 'changed' flag just prior to saving
        this._changed = false;
        this.file.source = this.model?.toXML();
        this.file.save();
    }

    /**
     * @returns {HumanTaskModelDefinition}
     */
    get model() {
        return this._model;
    }

    get label() {
        return 'Edit Human Task - ' + this.fileName;
    }
}
