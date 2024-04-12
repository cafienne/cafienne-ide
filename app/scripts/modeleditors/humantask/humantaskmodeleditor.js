'use strict';

class HumantaskModelEditor extends ModelEditor {
    /**
     * This object handles human task models, includes ui-editor and source editor
     * @param {HumanTaskFile} file The full file name to be loaded, e.g. 'helloworld.case', 'sendresponse.humantask'
     */
    constructor(file) {
        super(file);
        this.file = file;
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
        this.htmlContainer.find('.inputName').on('change', e => this.change('name', e.currentTarget.value));
        this.htmlContainer.find('.inputDocumentation').on('change', e => this.change('text', e.currentTarget.value, this.model.implementation.documentation));

        new RightSplitter(this.htmlContainer.find('#modelEditor'), '675px');

        // Render input parameters
        this.inputParametersControl = new ModelParameters(this, this.html.find('.model-input-parameters'), 'Input Parameters');
        this.outputParametersControl = new ModelParameters(this, this.html.find('.model-output-parameters'), 'Output Parameters');

        //add the tab control
        this.htmlContainer.find('.model-source-tabs').tabs({
            activate: (e, ui) => {
                if (ui.newPanel.hasClass('model-source-editor')) {
                    this.viewSourceEditor.render(XML.prettyPrint(this.model.toXML()));
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

    onEscapeKey(e) {
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

    /**
     * 
     * @param {String} propertyName 
     * @param {String} propertyValue 
     * @param {XMLElementDefinition} element
     */
    change(propertyName, propertyValue, element = this.model.implementation) {
        element[propertyName] = propertyValue;
        this.saveModel();
    }

    render() {
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
        // Clear current content
        this.taskPreview.html('');
        this.taskPreviewErrors.html('');
        this.jsonErrorDiv.html('');

        // Now check if there is a "sensible" expectation that we have a JSON schema in the taskmodel
        const taskModel = this.model.implementation.taskModel.value;
        if (!taskModel || taskModel.trim().indexOf('{') < 0) {
            return;
        }

        const errorHandler = e => this.taskPreviewErrors.html(`Alpaca Error Message: ${e.message}`);

        const parseResult = Util.parseJSON(taskModel);
        if (parseResult.object) {
            const jsonForm = parseResult.object;
            jsonForm.options = {
                focus: false
            }
            jsonForm.error = errorHandler;
            // Render the task view
            this.taskPreview.alpaca(jsonForm);
        } else {
            this.jsonErrorDiv.html(parseResult.description);
        }
    }

    /**
     * Sets or replaces the auto save timer (which runs 10 seconds after the last change)
     */
    taskModelChanged() {
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
    loadSource(source) {
        this.file.source = source;
        this.loadModel();
        this.saveModel();
    }

    saveModel() {
        // Remove 'changed' flag just prior to saving
        this._changed = false;
        this.file.source = this.model.toXML();
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

class HumantaskModelEditorMetadata extends ModelEditorMetadata {
    /** @returns {Array<ServerFile>} */
    get modelList() {
        return this.ide.repository.getHumanTasks();
    }

    get modelType() {
        return 'humantask';
    }

    /** @returns {Function} */
    get shapeType() {
        return HumanTaskView;
    }

    get description() {
        return 'Human Task Models';
    }

    /**
     * Create a new HumanTaskView model with given name and description 
     * @param {IDE} ide 
     * @param {String} name 
     * @param {String} description 
     * @param {Function} callback
     * @returns {String} fileName of the new model
     */
    createNewModel(ide, name, description, callback = (/** @type {String} */ fileName) => {}) {
        const newModelContent =
            `<humantask>
                <${IMPLEMENTATION_TAG} name="${name}" description="${description}" ${CAFIENNE_PREFIX}="${CAFIENNE_NAMESPACE}" class="org.cafienne.cmmn.definition.task.WorkflowTaskDefinition">
                    <task-model></task-model>
                </${IMPLEMENTATION_TAG}>
            </humantask>`;
        const fileName = name + '.humantask';
        ide.repository.createHumanTaskFile(fileName, newModelContent).save(() => callback(fileName));
        return fileName;
    }
}

IDE.registerEditorType(new HumantaskModelEditorMetadata());
