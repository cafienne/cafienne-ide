'use strict';

import $ from "jquery";
import GraphicalModelDefinition from "../../../repository/definition/graphicalmodeldefinition";
import ProcessModelDefinition from "../../../repository/definition/process/processmodeldefinition";
import ProcessFile from "../../../repository/serverfile/processfile";
import XML from "../../../util/xml";
import CodeMirrorConfig from "../../editors/external/codemirrorconfig";
import IDE from "../../ide";
import ModelEditor from "../modeleditor";
import ModelEditorMetadata from "../modeleditormetadata";
import ModelParameters from "../xmleditor/modelparameters";
import ModelSourceEditor from "../xmleditor/modelsourceeditor";
import ProcessModelEditorMetadata from "./processtaskmodeleditormetadata";

const HTTP_CALL_DEFINITION = 'HTTPCallDefinition';
const HTTP_CALL_DEFINITION_IMPLEMENTATION_CLASS = 'org.cafienne.processtask.implementation.http.HTTPCallDefinition';

const CALCULATION_DEFINITION = 'CalculationDefinition';
const CALCULATION_DEFINITION_IMPLEMENTATION_CLASS = 'org.cafienne.processtask.implementation.calculation.CalculationDefinition';

const MAIL_DEFINITION = 'MailDefinition';
const MAIL_DEFINITION_IMPLEMENTATION_CLASS = 'org.cafienne.processtask.implementation.mail.MailDefinition';

const PDF_REPORT_DEFINITION = 'PDFReportDefinition';
const PDF_REPORT_DEFINITION_IMPLEMENTATION_CLASS = 'org.cafienne.processtask.implementation.report.PDFReportDefinition';

const CUSTOM_IMPLEMENTATION_DEFINITION = ' ';
const CUSTOM_IMPLEMENTATION_DEFINITION_IMPLEMENTATION_CLASS = 'SPECIFY_IMPLEMENTATION_CLASS_HERE';

export default class ProcessModelEditor extends ModelEditor {
    inputParametersControl?: ModelParameters;
    outputParametersControl?: ModelParameters;
    viewSourceEditor?: ModelSourceEditor;
    freeContentEditor: any;
    private _changed: any;
    private _currentAutoSaveTimer?: number;
    private _model?: ProcessModelDefinition;
    static register() {
        ModelEditorMetadata.registerEditorType(new ProcessModelEditorMetadata());
    }

    /** 
     * This editor handles process models; only validates the xml
     */
    constructor(ide: IDE, public file: ProcessFile) {
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
                    <li><a href="#modelEditor">Editor</a></li>
                    <li><a href="#sourceEditor">Source</a></li>
                </ul>
                <div class="process-model-editor" id="modelEditor">
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
                    <div class="process-model-source">
                        <label>Process Type&nbsp;&nbsp;</label>
                        <select class="selectImplementationType">
                            <option value="" disabled selected>select implementation type</option>
                            <option value="${HTTP_CALL_DEFINITION_IMPLEMENTATION_CLASS}">${HTTP_CALL_DEFINITION}</option>
                            <option value="${CALCULATION_DEFINITION_IMPLEMENTATION_CLASS}">${CALCULATION_DEFINITION}</option>
                            <option value="${MAIL_DEFINITION_IMPLEMENTATION_CLASS}">${MAIL_DEFINITION}</option>
                            <option value="${PDF_REPORT_DEFINITION_IMPLEMENTATION_CLASS}">${PDF_REPORT_DEFINITION}</option>
                            <option value="${CUSTOM_IMPLEMENTATION_DEFINITION_IMPLEMENTATION_CLASS}">${CUSTOM_IMPLEMENTATION_DEFINITION}</option>
                        </select>
                        <div class="code-mirror-container"></div>
                    </div>
                </div>
                <div class="model-source-editor" id="sourceEditor"></div>
            </div>
        `);

        this.htmlContainer.append(html);

        //add change event to input fields
        this.htmlContainer.find('.inputName').on('change', (e: any) => this.changeName(e.currentTarget.value));
        this.htmlContainer.find('.inputDocumentation').on('change', (e: any) => this.changeDescription(e.currentTarget.value));
        this.htmlContainer.find('.selectImplementationType').on('change', (e: any) => this.changeImplementationType(e.currentTarget.value));

        // Render input parameters
        this.inputParametersControl = new ModelParameters(this, this.html.find('.model-input-parameters'), 'Input Parameters');
        this.outputParametersControl = new ModelParameters(this, this.html.find('.model-output-parameters'), 'Output Parameters');

        //add the tab control
        this.htmlContainer.find('.model-source-tabs').tabs({
            activate: (e: any, ui: any) => {
                if (ui.newPanel.hasClass('model-source-editor')) {
                    this.viewSourceEditor?.render(this.model?.toXMLString() || '');
                }
            }
        });

        // Add code mirror xml style
        this.freeContentEditor = CodeMirrorConfig.createXMLEditor(this.html.find('.code-mirror-container'));

        /*Events for saving and keeping track of changes in the task model editor
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
                this._validateAndSave();
            }
        });
        this.freeContentEditor.on('change', () => {
            this._enableAutoSave()
        });

        //add the source part
        this.viewSourceEditor = new ModelSourceEditor(this.html.find('.model-source-tabs .model-source-editor'), this);
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

    changeImplementationType(propertyValue: string) {
        if (!this.model) return;
        if (!this.model.implementation) return;
        const modelImplementation = XML.loadXMLString(this.model.implementation.xml).documentElement ?? (() => { throw new Error('No ownerDocument found'); })();
        modelImplementation.setAttribute("class", propertyValue);
        this.model.implementation.xml = XML.prettyPrint(modelImplementation);
        this.freeContentEditor.setValue(this.model.implementation.xml);
        this.saveModel();
    }

    render() {
        if (!this.model) return;
        if (!this.model.implementation) return;

        // Render name, description and implementationType
        this.htmlContainer.find('.inputName').val(this.model.name);
        this.htmlContainer.find('.inputDocumentation').val(this.model.documentation.text);
        this.renderImplementationType();
        this.inputParametersControl?.renderParameters(this.model.inputParameters);
        this.outputParametersControl?.renderParameters(this.model.outputParameters);

        // Set the implementation content in the code mirror editor and
        this.freeContentEditor.setValue(this.model.implementation.xml);
        this.freeContentEditor.refresh();
    }

    renderImplementationType() {
        if (!this.model) return;
        if (!this.model.implementation) return;

        const modelImplementationDocument = XML.loadXMLString(this.model.implementation.xml).documentElement ?? (() => { throw new Error('No ownerDocument found'); })();
        const implementationType = modelImplementationDocument.getAttribute("class") || '';
        const implementationTypeSelect = this.htmlContainer.find('.selectImplementationType');
        implementationTypeSelect.val(implementationType);

        if (implementationTypeSelect.val() != implementationType) {
            //Unknown value in the select, reset select to custom value
            implementationTypeSelect.val(CUSTOM_IMPLEMENTATION_DEFINITION_IMPLEMENTATION_CLASS);
        }
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
        setTimeout(() => this.freeContentEditor.refresh(), 100);
    }

    loadModel() {
        this._model = this.file.definition;
        this.render();
        this.visible = true;
    }

    loadDefinition(definition: GraphicalModelDefinition | undefined): void {
        throw new Error('Method not implemented, called from undoredomanager.');
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
        const value = this.freeContentEditor.getValue();
        const xmlData = XML.loadXMLString(value);

        // Must be valid xml - and contain a root tag
        if (XML.hasParseErrors(xmlData) || xmlData.childNodes.length == 0) {
            this.ide.danger('XML is invalid or missing, model will not be saved');
            return;
        }

        if (this.model && this.model.implementation) this.model.implementation.xml = value;
        this.renderImplementationType();

        this.saveModel();
    }
}
