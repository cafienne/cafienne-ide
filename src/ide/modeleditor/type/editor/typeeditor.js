import CaseTypeEditor from "@ide/modeleditor/case/editors/file/casetypeeditor";
import ModelSourceEditor from "@ide/modeleditor/xmleditor/modelsourceeditor";
import CaseFileItemTypeDefinition from "@repository/definition/cmmn/casefile/casefileitemtypedefinition";
import TypeFile from "@repository/serverfile/typefile";
import CodeMirrorConfig from "@util/codemirrorconfig";
import { andThen } from "@util/promise/followup";
import Util from "@util/util";
import XML from "@util/xml";
import $ from "jquery";
import TypeModelEditor from "../typemodeleditor";
import { MainTypeDefinition } from "./localtypedefinition";
import { PropertyRenderer, SchemaRenderer } from "./typerenderer";
import CaseView from "@ide/modeleditor/case/elements/caseview";

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
        this.propertyRenderers = [];
        /** @type {PropertyRenderer} */
        this.selectedPropertyRenderer = null;
        /** @type {SchemaRenderer} */
        this.schemaRenderer = null;
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
        this.html = $(`
            <div class="basicbox model-source-tabs">
                <ul>
                    <li><a href="#modelEditor">Editor</a></li>
                    <li><a href="#sourceEditor">Source</a></li>
                    <li><a href="#jsonSchemaEditor">JSON Schema</a></li>
                </ul>
                <div class="type-editor typeeditor" id="modelEditor">
                    <div class="formcontainer">
                        <div id="typeeditorcontent">
                            <div class="modelgenericfields">
                                <div>
                                    <label>Name</label>
                                    <input class="inputDefinitionName"/>
                                </div>
                            </div>
                            <div class="menu-container">
                                <img class="action-icon add-child-icon" src="images/svg/add-child-node.svg" title="Add child ..."/>
                                <img class="action-icon add-sibling-icon" src="images/svg/add-sibling-node.svg" title="Add sibling ..."/>
                                <img class="action-icon delete-icon" src="images/delete_32.png" title="Delete ..."/>
                            </div>
                            <div class="type-container">
                                <div class="property-header-container property-container">
                                    <div>Property Name</div>
                                    <div>Type</div>
                                    <div>Multiplicity</div>
                                    <div title="${this.biTooltip}">Business id</div>
                                </div>
                                <div class="type-schema-container schema-container">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="model-source-editor" id="sourceEditor"></div>
                <div class="json-schema-editor" id="jsonSchemaEditor"></div>
            </div>
        `);
        this.htmlParent.append(this.html);
        this.inputName = this.htmlParent.find('.inputDefinitionName');
        this.htmlTypeSchemaContainer = this.html.find('.type-schema-container');
        this.menuContainer = this.html.find('.menu-container');

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

        // add the source part
        this.viewSourceEditor = new ModelSourceEditor(this.htmlParent.find('.model-source-tabs .model-source-editor'), this);

        // add the JSON Schema part
        this.createJSONSchemaEditor();

        // add the event handlers, for adding changing data, mouse and keyboard
        this.attachEventHandlers();
    }

    attachEventHandlers() {
        // add change handler for the name of the root type
        this.inputName.on('change', e => {
            this.mainType.definition.name = e.currentTarget.value;
            this.mainType.save();
        });

        this.html.on('keydown', e => {
            if (this.selectedPropertyRenderer) {
                if (e.which === 27) { // Esc pressed for blur or deselect
                    e.preventDefault();
                    e.stopPropagation();
                    if (this.selectedPropertyRenderer.inputPropertyName.attr('readonly')) {
                        this.deselectPropertyRenderers();
                    } else {
                        this.selectedPropertyRenderer.inputPropertyName.trigger('blur');
                        const property = this.selectedPropertyRenderer.property;
                        if (property.isNew && !property.name && !property.type) {
                            this.removeProperty(e, this.selectedPropertyRenderer);
                        }
                    }
                }
                if (e.which === 113) { // F2 pressed for edit 
                    e.preventDefault();
                    e.stopPropagation();
                    this.selectedPropertyRenderer.inputNameFocusHandler();
                }
            }
        });

        this.html.find('.add-child-icon').on('click', e => this.addChild(e));
        this.html.find('.add-sibling-icon').on('click', e => this.addSibling(e));
        this.html.find('.delete-icon').on('click', e => this.removeProperty(e));
        this.html.on('click', () => this.deselectPropertyRenderers());
    }

    /**
     * 
     * @param {PropertyRenderer} propertyRenderer 
     */
    selectPropertyRenderer(propertyRenderer) {
        if (propertyRenderer === this.selectedPropertyRenderer) {
            return;
        }
        // Deselect current selected property
        if (this.selectedPropertyRenderer) {
            this.selectedPropertyRenderer.deselect();
        }
        if (this.case) {
            this.case.updateSelectedCaseFileItemDefinition(undefined);
        }
        this.selectedPropertyRenderer = propertyRenderer;
        if (propertyRenderer) {
            propertyRenderer.select();
            if (this.case) {
                const references = /** @type {Array<CaseFileItemTypeDefinition> } */ (propertyRenderer.property.searchInboundReferences().filter(element => element instanceof CaseFileItemTypeDefinition));
                const selectedProperty = references.find(cfi => cfi.caseDefinition === this.case.caseDefinition);
                this.case.updateSelectedCaseFileItemDefinition(selectedProperty);
            }
        }
        this.renderComplexOrPrimitiveTypeStyle();
    }

    deselectPropertyRenderers() {
        this.selectPropertyRenderer(undefined);
    }

    renderComplexOrPrimitiveTypeStyle() {
        if (this.selectedPropertyRenderer) {
            if (this.selectedPropertyRenderer.property.isComplexType) {
                this.menuContainer.addClass('complex-type');
                this.menuContainer.removeClass('primitive-type');
            } else {
                this.menuContainer.addClass('primitive-type');
                this.menuContainer.removeClass('complex-type');
            }
        } else {
            this.menuContainer.removeClass('primitive-type');
            this.menuContainer.removeClass('complex-type');
        }
    }

    /**
     * 
     * @param {*} e 
     * @param {PropertyRenderer} from 
     * @returns {PropertyRenderer}
     */
    addChild(e, from = this.selectedPropertyRenderer) {
        return this.addProperty(e, false, from)
    }

    /**
     * 
     * @param {*} e 
     * @param {PropertyRenderer} from 
     * @returns {PropertyRenderer}
     */
    addSibling(e, from = this.selectedPropertyRenderer) {
        return this.addProperty(e, true, from)
    }

    /**
     * Add a property as child under "from" (insertAsSibling=false)
     * Add a property as sibling after "from" (insertAsSibling=true)
     * Defaults 
     * @param {*} e 
     * @param {boolean} insertAsSibling 
     * @param {PropertyRenderer} from 
     * @returns {PropertyRenderer}
     */
    addProperty(e, insertAsSibling = false, from) {
        e.preventDefault();
        e.stopPropagation();
        /** @type {PropertyRenderer} */
        let newProperty = null;
        if (from) {
            if (insertAsSibling) {
                // adding child only possible for properties of complex type
                // for primitive types just add as a sibling instead;
                newProperty = from.parent.addEmptyPropertyRenderer(from);
            } else {
                if  (from.schemaRenderer) {
                    newProperty = from.schemaRenderer.addEmptyPropertyRenderer();
                } else {
                    this.ide.warning('Not possible to add a child to a primitive type property', 3000);
                }
            }
        } else {
            if (insertAsSibling) {
                newProperty = this.schemaRenderer.addEmptyPropertyRenderer();
            } else {
                this.ide.warning('Not possible to add a child here', 3000);               
            }
        }
        if (newProperty) {
            this.selectPropertyRenderer(newProperty);
            newProperty.inputNameFocusHandler();    
        }
        return newProperty;
    }

    /**
     * 
     * @param {*} e 
     * @param {PropertyRenderer} property 
     */
    removeProperty(e, property = this.selectedPropertyRenderer) {
        if (property) {
            property.removeProperty();
            this.deselectPropertyRenderers();
        } else {
            this.ide.warning('Select a Property to be removed', 3000);
        }
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
        if (this.schemaRenderer) {
            this.schemaRenderer.delete();
            Util.clearHTML(this.htmlTypeSchemaContainer);
            this.inputName.val('');
        }

        this.file = file;
        if (file) {
            file.load(andThen(file => {
                this.mainType = new MainTypeDefinition(this, this.file);
                // Render name and definitionType
                this.htmlParent.find('.inputDefinitionName').val(this.mainType.definition.name);
                this.schemaRenderer = new SchemaRenderer(this, this.htmlTypeSchemaContainer, this.mainType);
                this.schemaRenderer.render();
            }));
        }
    }

    delete() {
        if (this.schemaRenderer) {
            this.schemaRenderer.delete();
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
