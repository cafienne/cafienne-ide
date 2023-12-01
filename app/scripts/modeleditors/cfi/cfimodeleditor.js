'use strict';

class CFIModelEditor extends ModelEditor {
    /**
     * This editor handles cfi models; only validates the xml
     * @param {CFIFile} file The full file name to be loaded, e.g. 'helloworld.case', 'sendresponse.humantask'
     */
    constructor(file) {
        super(file);
        this.file = file;
        this.generateHTML();
    }

    get label() {
        return 'Edit Case File Item - ' + this.fileName;
    }

    /**
     * adds the html of the entire page
     */
    generateHTML() {
        const html = $(`
            <div class="basicbox model-source-tabs">
                <ul>
                    <li><a href="#modelEditor">Editor</a></li>
                    <li><a href="#sourceEditor">Source</a></li>
                </ul>
                <div class="cfi-model-editor cfiefeditor" id="modelEditor">
                    <div class="formcontainer">
                        <div id="cfiefeditorcontent">
                            <div class="maincfidefdata">
                                <div>
                                    <label>Name</label>
                                    <input class="inputDefinitionName"/>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="model-source-editor" id="sourceEditor"></div>
            </div>
        `);

        //add the cfi definition editor html to the splitter area
        this.htmlContainer.append(html);

        //add change handler for the name
        this.html.find('.inputDefinitionName').on('change', e => this.change('name', e.currentTarget.value));

        //add the tab control
        this.htmlContainer.find('.model-source-tabs').tabs({
            activate: (e, ui) => {
                if (ui.newPanel.hasClass('model-source-editor')) {
                    this.viewSourceEditor.render(XML.prettyPrint(this.model.toXML()));
                }
            }
        });

        this.htmlContainer.find('.model-source-tabs').tabs('enable', 1);

        //add the source part
        this.viewSourceEditor = new ModelSourceEditor(this.html.find('.model-source-tabs .model-source-editor'), this);
    }

    onEscapeKey(e) {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
            return;
        }
        this.close();
    }

    /**
     * 
     * @param {String} propertyName 
     * @param {String} propertyValue 
     * @param {XMLElementDefinition} element
     */
    change(propertyName, propertyValue, element = this.model) {
        element[propertyName] = propertyValue;
        this.saveModel();
    }

    render() {
        // Render name
        this.htmlContainer.find('.inputDefinitionName').val(this.model.name);
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
        //this refresh, is a workaround for defect in codemirror
        //not rendered properly when html is hidden
        // setTimeout(() => this.freeContentEditor.refresh(), 100);
    }

    loadModel() {
        this.file.load(() => this.renderModel());
    }

    renderModel() {
        this._model = this.file.definition;
        this.render();
        this.visible = true;
    }

    /**
     * handle the change of the source (in 2nd tab)
     */
    loadSource(newSource) {
        this.file.source = newSource;
        this.renderModel();
        this.saveModel();
    }

    saveModel() {
        // Remove 'changed' flag just prior to saving
        this._changed = false;
        this.file.source = this.model.toXML();
        this.file.save();
    }

    /**
     * @returns {CaseFileItemDefinition}
     */
    get model() {
        return this._model;
    }

    //handle the change of process implementation
    _validateAndSave() {
        this.saveModel();
    }
}

class CFIModelEditorMetadata extends ModelEditorMetadata {
    /** @returns {Array<ServerFile>} */
    get modelList() {
        return this.ide.repository.getCaseFileItems();
    }

    get modelType() {
        return 'cfi';
    }

    /** @returns {Function} */
    get shapeType() {
        return CaseFileItem;
    }

    get description() {
        return 'Case File Items';
    }

    /**
     * Create a new CaseFileItem model with given name and description 
     * @param {IDE} ide 
     * @param {String} name 
     * @param {String} description 
     * @param {Function} callback
     * @returns {String} fileName of the new model
     */
    createNewModel(ide, name, description, callback = (/** @type {String} */ fileName) => {}) {
        const fileName = name + '.cfi';
        const newModelContent = `<caseFileItem id="${fileName}" name="${name}" definitionRef=""/>`;
        ide.repository.createCFIFile(fileName, newModelContent).save(() => callback(fileName));
        return fileName;        
    }
}

IDE.registerEditorType(new CFIModelEditorMetadata());
