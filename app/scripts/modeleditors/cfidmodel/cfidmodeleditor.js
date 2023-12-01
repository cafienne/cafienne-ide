'use strict';

class CFIDModelEditor extends ModelEditor {
    /**
     * This editor handles cfid models; only validates the xml
     * @param {CFIDFile} file The full file name to be loaded, e.g. 'helloworld.case', 'sendresponse.humantask'
     */
    constructor(file) {
        super(file);
        this.file = file;
        //define default definitionTypes
        this.definitionTypes = [
            { name: UNSPECIFIED, uri: UNSPECIFIED_URI, editor: CFIDModelDefinitionUnspecified },
            { name: XMLELEMENT, uri: XMLELEMENT_URI, editor: CFIDModelDefinitionXMLElement },
            { name: UNKNOWN, uri: UNKNOWN_URI, editor: CFIDModelDefinitionUnknown }
        ];
        this.__editors = [];
        this.generateHTML();
    }

    get label() {
        return 'Edit Case File Item Definition - ' + this.fileName;
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
                <div class="cfid-model-editor cfidefeditor" id="modelEditor">
                    <div class="formcontainer">
                        <div id="cfidefeditorcontent">
                            <div class="maincfidefdata">
                                <div>
                                    <label>Name</label>
                                    <input class="inputDefinitionName"/>
                                </div>
                                <div>
                                    <label>Definition Type</label>
                                    <select>
                                        <option value="${UNSPECIFIED_URI}">${UNSPECIFIED}</option>
                                        <option value="${XMLELEMENT_URI}">${XMLELEMENT}</option>
                                        <option value="${UNKNOWN_URI}">${UNKNOWN}</option>
                                    </select>
                                </div>
                            </div>
                            <div class="cfideftypecontainer"></div>
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

        //add change handler for the select of definitionType
        this.html.find('.maincfidefdata select').on('change', e => {
            this.change('definitionType', e.currentTarget.value);
            this.renderDefinitionTypeEditor();
        });

        //html node having the details of the cfidef (details determined by the definition type)
        this.definitionTypeContainer = this.html.find('.cfideftypecontainer');

        // Create editors for each definition type
        for (let i = 0; i < this.definitionTypes.length; i++) {
            const dtd = this.definitionTypes[i];
            this.__editors[dtd.uri] = new dtd.editor(this, this.definitionTypeContainer);
        }

        //add the tab control
        this.htmlContainer.find('.model-source-tabs').tabs({
            activate: (e, ui) => {
                if (ui.newPanel.hasClass('model-source-editor')) {
                    this.viewSourceEditor.render(XML.prettyPrint(this.model.toXML()));
                }
            }
        });

        this.htmlContainer.find('.model-source-tabs').tabs("enable", 1)

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
        // Render name and definitionType
        this.htmlContainer.find('.inputDefinitionName').val(this.model.name);
        this.htmlContainer.find('.maincfidefdata select').val(this.model.definitionType);
        this.renderDefinitionTypeEditor();
    }

    renderDefinitionTypeEditor() {
        const defType = this._model.definitionType;
        this.definitionTypeContainer.children().css('display', 'none');
        this.__editors[defType].show(this._model);
        this.__editors[defType].html.css('display', '');
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

    /**
     */
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
     * @returns {CaseFileDefinitionDefinition}
     */
    get model() {
        return this._model;
    }

    //handle the change of process implementation
    _validateAndSave() {
        this.saveModel();
    }
}

class CFIDModelEditorMetadata extends ModelEditorMetadata {
    /** @returns {Array<ServerFile>} */
    get modelList() {
        return this.ide.repository.getCaseFileItemDefinitions();
    }

    get modelType() {
        return 'cfid';
    }

    /** @returns {Function} */
    get shapeType() {
        /** TODO: JohanR: Should be a CaseFileItemDefintion but currently not available as CMMNElement View object as CFID are not drawable canvas objects in case model */
        return CaseFileItem;
    }

    get description() {
        return 'Case File Item Definitions';
    }

    /**
     * Create a new CaseFileItemDefinition model with given name and description 
     * @param {IDE} ide 
     * @param {String} name 
     * @param {String} description 
     * @param {Function} callback
     * @returns {String} fileName of the new model
     */
    createNewModel(ide, name, description, callback = (/** @type {String} */ fileName) => {}) {
        const newModelContent = XML.loadXMLString(`<caseFileItemDefinition name="${name}" definitionType="http://www.omg.org/spec/CMMN/DefinitionType/Unspecified" />`);
        const fileName = name + '.cfid';
        ide.repository.createCFIDFile(fileName, newModelContent).save(() => callback(fileName));
        return fileName;        
    }
}

IDE.registerEditorType(new CFIDModelEditorMetadata());
