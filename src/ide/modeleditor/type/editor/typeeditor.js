import CaseTypeEditor from "@ide/modeleditor/case/editors/file/casetypeeditor";
import CaseView from "@ide/modeleditor/case/elements/caseview";
import ModelSourceEditor from "@ide/modeleditor/xmleditor/modelsourceeditor";
import TypeFile from "@repository/serverfile/typefile";
import CodeMirrorConfig from "@util/codemirrorconfig";
import Util from "@util/util";
import XML from "@util/xml";
import $ from "jquery";
import TypeModelEditor from "../typemodeleditor";
import { MainTypeDefinition } from "./localtypedefinition";
import { SchemaRenderer } from "./typerenderer";

export default class TypeEditor {
    /**
     * Edit the Type definition
     * @param {CaseTypeEditor|TypeModelEditor} owner
     * @param {JQuery<HTMLElement>} htmlParent 
     * @param {CaseView} cs 
     */
    constructor(owner, htmlParent, cs = undefined) {
        this.owner = owner;
        this.ide = owner.ide;
        this.htmlParent = htmlParent;
        this.case = cs;
        this.biTooltip = 'Cases and Tasks can be queried on business identifiers.\nThe identifiers are tracked in a separate index, but adding identifiers does have a performance impact';
        this.generateHTML();
    }

    get label() {
        return 'Edit Type - ' + this.file.fileName;
    }
    /**
     * adds the html of the entire page
     */
    generateHTML() {
        this.htmlContainer = $(`
            <div class="basicbox model-source-tabs">
                <ul>
                    <li><a href="#modelEditor">Editor</a></li>
                    <li><a href="#sourceEditor">Source</a></li>
                    <li><a href="#jsonSchemaEditor">JSON Schema</a></li>
                </ul>
                <div class="type-model-editor typeeditor" id="modelEditor">
                    <div class="formcontainer">
                        <div id="typeeditorcontent">
                            <div class="modelgenericfields">
                                <div>
                                    <label>Name</label>
                                    <input class="inputDefinitionName"/>
                                </div>
                            </div>
                            <div class="typecontainer">
                                <div class="propertyheadercontainer propertycontainer">
                                    <div>Property Name</div>
                                    <div>Type</div>
                                    <div>Multiplicity</div>
                                    <div title="${this.biTooltip}">Business Identifier</div>
                                </div>
                                <div class="typeschemacontainer schemacontainer">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="model-source-editor" id="sourceEditor"></div>
                <div class="json-schema-editor" id="jsonSchemaEditor"></div>
            </div>
        `);
        this.htmlParent.append(this.htmlContainer);

        this.inputName = this.htmlParent.find('.inputDefinitionName');

        // add change handler for the name of the root type
        this.inputName.on('change', e => {
            this.mainType.definition.name = e.currentTarget.value;
            this.mainType.save();
        });

        this.htmlTypeSchemaContainer = this.htmlParent.find('.typeschemacontainer')

        // add the tab control
        this.htmlParent.find('.model-source-tabs').tabs({
            activate: (e, ui) => {
                if (ui.newPanel.hasClass('model-source-editor')) {
                    const xml = this.mainType ? XML.prettyPrint(this.mainType.xml) : '';
                    this.viewSourceEditor.render(xml);
                }
                if (ui.newPanel.hasClass('json-schema-editor')) {
                    const json = this.mainType ? JSON.stringify(this.mainType.json, undefined, 2) : '';
                    this.jsonSchemaEditor.setValue(json);
                }
            }
        });

        this.htmlParent.find('.model-source-tabs').tabs('enable', 1);

        //add the source part
        this.viewSourceEditor = new ModelSourceEditor(this.htmlParent.find('.model-source-tabs .model-source-editor'), this);

        //add the JSON Schema part
        this.createJSONSchemaEditor();
    }

    createJSONSchemaEditor() {
        //add code mirror JSON style
        this.jsonSchemaEditor = CodeMirrorConfig.createJSONEditor(this.htmlParent.find('.model-source-tabs .json-schema-editor'));

        /* Events for saving and keeping track of changes in the task model editor
        The model should only be saved when there is a change and the codemirror is blurred.
        The onchange event of codemirror fires after every keydown, this is not wanted.
        So only save after blur, but only when there is a change in content.
        */
        // Add event handlers on code mirror to track changes
        this.jsonSchemaEditor.on('focus', () => this._changed = false);
        this.jsonSchemaEditor.on('blur', () => {
            if (this._changed) {
                //TODO Need to implement parsing changes in the JSON Schema:
                this.ide.warning('Parsing changes in JSON Schema not implemented', 2000);
            }
        });
        this.jsonSchemaEditor.on('change', () => { this._changed = true; });
    }

    /**
     * return a string that defines the <option>'s for the type select
     * The select has an empty option and the already available type's
     * @returns {String}
     */
    getOptionTypeHTML() {
        // First create 1 options for "empty" then add all type files
        return (
            ['<option value=""></option>']
                .concat(this.ide.repository.getTypes().map(type => `<option value="${type.fileName}">${type.name}</option>`))
                .join(''));
    };

    onShow() {
        //always start with editor tab
        this.htmlParent.find('.model-source-tabs').tabs('option', 'active', 0);
    }

    /**
     * 
     * @param {TypeFile} file 
     */
    setMainType(file) {
        // Clean current main type and renderer
        this.mainType = undefined;
        if (this.renderer) {
            this.renderer.delete();
            Util.clearHTML(this.htmlTypeSchemaContainer);
            this.inputName.val('');
        }

        this.file = file;
        if (file) {
            file.load().then(file => {
                this.mainType = new MainTypeDefinition(this, this.file);
                // Render name and definitionType
                this.htmlParent.find('.inputDefinitionName').val(this.mainType.definition.name);
                this.renderer = new SchemaRenderer(this, this.htmlTypeSchemaContainer, this.mainType);
                this.renderer.render();    
            });
        }
    }

    delete() {
        if (this.renderer) {
            this.renderer.delete();
        }
        Util.removeHTML(this.htmlParent);
    }

    refresh() {
        this.setMainType(this.file);
    }

    /**
     * handle the change of the source (in 2nd tab)
     */
    loadSource(newSource) {
        if (this.file) {
            this.file.source = newSource;
            this.mainType.save(); // Saving the type will refresh the editor    
        }
    }
}
