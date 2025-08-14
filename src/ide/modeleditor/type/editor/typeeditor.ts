import $ from "jquery";
import CaseFileItemTypeDefinition from "../../../../repository/definition/cmmn/casefile/casefileitemtypedefinition";
import TypeDefinition from "../../../../repository/definition/type/typedefinition";
import TypeDefinitionElement from "../../../../repository/definition/type/typedefinitionelement";
import TypeFile from "../../../../repository/serverfile/typefile";
import XML from "../../../../util/xml";
import CodeMirrorConfig from "../../../editors/external/codemirrorconfig";
import IDE from "../../../ide";
import HtmlUtil from "../../../util/htmlutil";
import Images from "../../../util/images/images";
import CaseTypeEditor from "../../case/editors/file/casetypeeditor";
import CaseCanvas from "../../case/elements/casecanvas";
import ModelSourceEditor from "../../xmleditor/modelsourceeditor";
import TypeModelEditor from "../typemodeleditor";
import MainTypeDefinition from "./maintypedefinition";
import PropertyRenderer from "./propertyrenderer";
import SchemaRenderer from "./schemarenderer";
import TypeRenderer from "./typerenderer";

export default class TypeEditor {
    viewSourceEditor: ModelSourceEditor;
    jsonSchemaEditor: any; // Should be something like CodeMirror.Editor;
    private _changed: boolean = false;
    visible: boolean = false;
    case?: CaseCanvas;
    ide: IDE;
    html: JQuery<HTMLElement>;
    inputName: JQuery<HTMLElement>;
    htmlTypeSchemaContainer: JQuery<HTMLElement>;
    mainType?: MainTypeDefinition;
    renderer?: SchemaRenderer;
    file?: TypeFile;
    selectedPropertyRenderer?: PropertyRenderer;
    menuContainer: JQuery<HTMLElement>;
    quickEditMode: boolean = false; // Upon pressing buttons (insert/add) then keyboard can be used to keep typing new props.
    /**
     * Edit the Type definition
     */
    constructor(public owner: CaseTypeEditor | TypeModelEditor, public htmlParent: JQuery<HTMLElement>, cs?: CaseCanvas) {
        this.ide = owner.ide;
        this.case = cs;

        const biTooltip = 'Cases and Tasks can be queried on business identifiers.\nThe identifiers are tracked in a separate index, but adding identifiers does have a performance impact';
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
                                <img class="action-icon add-child-icon" src="${Images.AddChildNode}" title="Add child ..."/>
                                <img class="action-icon add-sibling-icon" src="${Images.AddSiblingNode}" title="Add sibling ..."/>
                                <img class="action-icon delete-icon" src="${Images.Delete}" title="Delete ..."/>
                            </div>
                            <div class="type-container">
                                <div class="property-header-container property-container">
                                    <div>Property Name</div>
                                    <div>Type</div>
                                    <div>Multiplicity</div>
                                    <div title="${biTooltip}">Business Identifier</div>
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

        // add the JSON Schema part, with code mirror JSON style
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

        // add the event handlers, for adding changing data, mouse and keyboard
        this.attachEventHandlers();
    }

    get label() {
        return 'Edit Type - ' + this.file?.fileName;
    }

    attachEventHandlers() {
        // add change handler for the name of the root type
        this.inputName.on('change', e => {
            if (this.mainType) {
                this.mainType.definition.name = (e.currentTarget as any).value;
                this.mainType.save();
            }
        });

        this.html.on('keydown', e => {
            if (this.selectedPropertyRenderer) {
                if (e.which === 27) { // Esc pressed for blur or deselect
                    e.preventDefault();
                    e.stopPropagation();
                    this.selectedPropertyRenderer.inputPropertyName?.trigger('blur');
                    this.deselectPropertyRenderers();
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

    selectPropertyRenderer(propertyRenderer?: PropertyRenderer) {
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
            if (this.case && propertyRenderer.property.isComplexType) {
                const references: CaseFileItemTypeDefinition[] = <CaseFileItemTypeDefinition[]>propertyRenderer.property.searchInboundReferences().filter(element => element instanceof CaseFileItemTypeDefinition);
                const selectedProperty = references.find(cfi => cfi.caseDefinition === this.case?.caseDefinition);
                this.case.updateSelectedCaseFileItemDefinition(selectedProperty);
            }
        }
        this.renderComplexOrPrimitiveTypeStyle();
        this.removeEmptyPropertyRenderers();
    }

    deselectPropertyRenderers() {
        if (this.quickEditMode) {
            // console.warn("Setting edit mode to false")
            this.quickEditMode = false;
        }

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

    addChild(e: any, from: PropertyRenderer | undefined = this.selectedPropertyRenderer): PropertyRenderer | undefined {
        return this.addProperty(e, false, from)
    }

    addSibling(e: any, from = this.selectedPropertyRenderer): PropertyRenderer | undefined {
        return this.addProperty(e, true, from);
    }

    /**
     * Add a property as child under "from" (insertAsSibling=false)
     * Add a property as sibling after "from" (insertAsSibling=true)
     * Defaults 
     */
    addProperty(e: any, insertAsSibling = false, from?: PropertyRenderer): PropertyRenderer | undefined {
        e.preventDefault();
        e.stopPropagation();
        if (!this.quickEditMode) {
            // console.warn("Setting edit mode to true")    
            this.quickEditMode = true;
        }

        let newProperty: PropertyRenderer | undefined = undefined;
        if (from) {
            if (insertAsSibling) {
                // adding child only possible for properties of complex type
                // for primitive types just add as a sibling instead;
                newProperty = from.parent.addEmptyPropertyRenderer(from);
            } else {
                if (from.schemaRenderer) {
                    newProperty = from.schemaRenderer.addEmptyPropertyRenderer();
                } else {
                    this.ide.warning('Not possible to add a child to a primitive type property', 3000);
                }
            }
        } else {
            if (insertAsSibling) {
                newProperty = this.renderer?.addEmptyPropertyRenderer();
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

    removeProperty(e: any, property = this.selectedPropertyRenderer) {
        if (property) {
            property.removeProperty();
            this.deselectPropertyRenderers();
        } else {
            this.ide.warning('Select a Property to be removed', 3000);
        }
    }

    removeEmptyPropertyRenderers(renderer: TypeRenderer<TypeDefinitionElement> | undefined = this.renderer) {
        renderer?.children.forEach(r => {
            this.removeEmptyPropertyRenderers(r);
            if (r instanceof PropertyRenderer) {
                if (r.property.isNew && r != this.selectedPropertyRenderer) {
                    r.removeProperty();
                }
            }
        });
    }

    onShow() {
        //always start with editor tab
        this.htmlParent.find('.model-source-tabs').tabs('option', 'active', 0);
    }

    async loadMainType(typeRef?: string) {
        if (!typeRef) {
            this.setMainType();
        } else {
            const file = await this.ide.repository.load<TypeDefinition>(typeRef);
            this.setMainType(file);
        }
    }

    async setMainType(file?: TypeFile) {
        // Clean current main type and renderer
        this.mainType = undefined;
        if (this.renderer) {
            this.renderer.delete();
            this.deselectPropertyRenderers();
            HtmlUtil.clearHTML(this.htmlTypeSchemaContainer);
            this.inputName.val('');
        }

        this.file = file;
        if (file) {
            await file.load();
            this.mainType = new MainTypeDefinition(this, file);
            // Render name and definitionType
            this.htmlParent.find('.inputDefinitionName').val(this.mainType.definition.name);
            this.renderer = new SchemaRenderer(this, undefined, this.htmlTypeSchemaContainer, this.mainType);
            this.renderer.render();
        }
    }

    delete() {
        if (this.renderer) {
            this.renderer.delete();
        }
        HtmlUtil.removeHTML(this.htmlParent);
    }

    refresh() {
        this.setMainType(this.file);
    }

    /**
     * handle the change of the source (in 2nd tab)
     */
    loadSource(newSource: any) {
        if (this.file) {
            this.file.source = newSource;
            this.file.parse();
            this.mainType?.save(); // Saving the type will refresh the editor    
        }
    }
}
