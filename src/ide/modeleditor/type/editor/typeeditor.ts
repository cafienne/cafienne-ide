'use strict';

import IDE from "@ide/ide";
import ModelSourceEditor from "@ide/modeleditor/xmleditor/modelsourceeditor";
import SchemaDefinition from "@repository/definition/type/schemadefinition";
import SchemaPropertyDefinition from "@repository/definition/type/schemapropertydefinition";
import XMLSerializable from "@repository/definition/xmlserializable";
import TypeFile from "@repository/serverfile/typefile";
import CodeMirrorConfig from "@util/codemirrorconfig";
import Util from "@util/util";
import XML from "@util/xml";
import $ from "jquery";

export default class TypeEditor {
    viewSourceEditor: ModelSourceEditor;
    jsonSchemaEditor: any; // Should be something like CodeMirror.Editor;
    private _changed: boolean = false;
    visible: boolean = false;
    /**
     * Edit the Type definition
     * @param {IDE} ide 
     * @param {TypeFile} file 
     * @param {JQuery<HTMLElement>} htmlParent 
     */

    constructor(public ide: IDE, public file: TypeFile, public htmlContainer: JQuery<HTMLElement>) {
        const biTooltip = 'Cases and Tasks can be queried on business identifiers.\nThe identifiers are tracked in a separate index, but adding identifiers does have a performance impact';
        const html = $(`
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
                                    <div title="${biTooltip}">Business Identifier</div>
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

        // add the type editor html to the splitter area
        this.htmlContainer.append(html);

        // add change handler for the name
        this.htmlContainer.find('.inputDefinitionName').on('change', e => this.change('name', (e.currentTarget as any).value));

        // add the tab control
        this.htmlContainer.find('.model-source-tabs').tabs({
            activate: (e, ui) => {
                if (ui.newPanel.hasClass('model-source-editor')) {
                    this.viewSourceEditor.render(XML.prettyPrint(this.file.definition?.toXML()));
                }
                if (ui.newPanel.hasClass('json-schema-editor')) {
                    this.jsonSchemaEditor.setValue(JSON.stringify(this.file.definition?.toJSONSchema(), null, 2));
                }
            }
        });

        this.htmlContainer.find('.model-source-tabs').tabs('enable', 1);

        // add the source part
        this.viewSourceEditor = new ModelSourceEditor(this.htmlContainer.find('.model-source-tabs .model-source-editor'), this);

        // add the JSON Schema part, with code mirror JSON style
        this.jsonSchemaEditor = CodeMirrorConfig.createJSONEditor(this.htmlContainer.find('.model-source-tabs .json-schema-editor'));

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
                // (this.file as any)['activeDefinition'].parseJSONSchema(JSON.parse(this.jsonSchemaEditor.getValue()));
                // this.saveModel(this.file);
                this.ide.warning('Parsing changes in JSON Schema not implemented');
            }
        });
        this.jsonSchemaEditor.on('change', () => { this._changed = true; });
    }

    get label() {
        return 'Edit Type - ' + this.file.fileName;
    }

    change(propertyName: string, propertyValue: string) {
        (this.file.definition as any)[propertyName] = propertyValue;
        this.saveModel(this.file);
    }

    render() {
        // Render name and definitionType
        this.htmlContainer.find('.inputDefinitionName').val((this.file as any)['activeDefinition'].name);
        this.renderSchema((this.file as any)['activeDefinition'].schema, this.file, this.htmlContainer.find('.typeschemacontainer'));
    }

    /**
     * The template property in UI table to add a new property in schema
     */
    createPropertyTemplate(schema: SchemaDefinition): SchemaPropertyDefinition {
        // create a new, empty parameter at the end of the types
        const property: SchemaPropertyDefinition = schema.createDefinition(SchemaPropertyDefinition);
        property.name = '';
        property.type = '';
        property.isBusinessIdentifier = false;
        property.multiplicity = 'ExactlyOne';
        property['isNew'] = true;
        return property;
    }

    renderSchema(schema: SchemaDefinition, file: TypeFile, container: JQuery<HTMLElement>) {
        Util.clearHTML(container);
        if (schema) {
            container.data('data', new ContainerData(schema, file));
            container.css('display', 'block');
            schema.properties.forEach(type => this.renderProperty(type, file, container));
            this.renderProperty(this.createPropertyTemplate(schema), file, container);
        }
    }

    renderProperty(property: SchemaPropertyDefinition, file: TypeFile, container:JQuery<HTMLElement>): JQuery<HTMLElement> {
        const html = $(`<div class='propertycontainer'>
            <div><img style="width:14px;margin:2px" src="/images/svg/casefileitem.svg"></img><input class="inputPropertyName" value="${property.name}" /><button tabindex="-1" class="buttonRemoveProperty" title="Delete property"></button></div>
            <div><select class="selectType">
                    <option value=""></option>
                    <option value="string">string</option>
                    <option value="number">number</option>
                    <option value="integer">integer</option>
                    <option value="boolean">boolean</option>
                    <option value="object">object</option>
                    ${this.getOptionTypeHTML()}
                </select>
            </div>
            <div>
                <select class="selectMultiplicity">
                    <option value="ExactlyOne">[1]</option>
                    <option value="ZeroOrOne">[0..1]</option>
                    <option value="ZeroOrMore">[0..*]</option>
                    <option value="OneOrMore">[1..*]</option>
                    <option value="Unspecified">[*]</option>
                    <option value="Unknown">[?]</option>
                </select>
            </div>
            <div style="text-align:center">
                <input type="checkbox" class="inputBusinessIdentifier" ${property.isBusinessIdentifier ? ' checked' : ''} />
            </div>
            <div class="propertyschemacontainer schemacontainer">
            </div>
        </div>`);
        html.find('.buttonRemoveProperty').on('click', e => {
            // remove the attribute (and all nested embedded attriute from the activeDefinition and the html table
            if (property['isNew']) {
                return;
            }
            // remove from the definition
            Util.removeFromArray(/** @type {SchemaDefinition} */(property.parent).properties, property);
            // remove from the html
            Util.removeHTML(html);
            this.saveModel(file);
        });
        container.append(html);
        html.data('data', new ContainerData(property, file));
        html.find('.inputPropertyName').on('change', e => this.changeProperty('name', (e.currentTarget as any).value, property, file, html));
        html.find('.selectType').on('change', e => this.changeProperty('cmmnType', (e.currentTarget as any).value, property, file, html));
        html.find('.selectType').val(property.cmmnType);
        html.find('.selectMultiplicity').on('change', e => this.changeProperty('multiplicity', (e.currentTarget as any).value, property, file, html));
        html.find('.selectMultiplicity').val(property.multiplicity);
        html.find('.inputBusinessIdentifier').on('change', e => this.changeProperty('isBusinessIdentifier', (e.currentTarget as any).checked, property, file, html));
        this.renderComplexTypeProperty(property, file, html);
        return html;
    }

    async renderComplexTypeProperty(property: SchemaPropertyDefinition, file: TypeFile, container: JQuery<HTMLElement>) {
        // Clear previous content of the schema container (if present)
        const schemaContainer = container.find('>.schemacontainer');
        Util.clearHTML(schemaContainer);
        schemaContainer.css('display', 'none');
        schemaContainer.data('data', null);
        // Clear previous cycle detected message (if present)
        container.find('.selectType').css('border', '');
        container.find('.selectType').attr('title', '');
        if (property.isComplexType) {
            if (property.type === 'object' && property.schema) {
                this.renderSchema(property.schema, file, schemaContainer);
            } else {
                const typeRef = property.typeRef;
                if (typeRef && this.ide.repository.get(typeRef)) {
                    const cyclePath = this.isCycleDetected(typeRef, container);
                    if (cyclePath) {
                        const tooltip = `Cycle detected in: ${cyclePath}`;
                        this.ide.danger(tooltip);
                        container.find('.selectType').css('border', '2px solid red');
                        container.find('.selectType').attr('title', tooltip);
                    } else {
                        const file: TypeFile = await this.ide.repository.load(typeRef);
                        if (file.definition)  this.renderSchema(file.definition.schema, file, schemaContainer);
                    }
                }
            }
        }
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

    /**
     * 
     * @param {String} propertyName
     * @param {String} propertyValue 
     * @param {SchemaPropertyDefinition} property
     * @param {TypeFile} file
     * @param {JQuery<HTMLElement>} html
     */
    changeProperty(propertyName: string, propertyValue: string, property: SchemaPropertyDefinition, file: TypeFile, html: JQuery<HTMLElement>) {
        if (property['isNew']) {
            // No longer transient parameter
            property['isNew'] = false;
            const schema = /** @type {SchemaDefinition} */ (property.parent);
            schema.properties.push(property);
            this.renderProperty(this.createPropertyTemplate(schema), file, html.parent());
        }
        const oldPropertyValue = (property as any)[propertyName];
        (property as any)[propertyName] = propertyValue;
        if (oldPropertyValue != propertyValue) {
            this.saveModel(file);
            if (propertyName === 'type') {
                this.renderComplexTypeProperty(property, file, html);
            }
        }
    }

    onShow() {
        //always start with editor tab
        this.htmlContainer.find('.model-source-tabs').tabs('option', 'active', 0);
    }

    async loadModel() {
        await this.file.load();
        this.renderModel();
    }

    renderModel() {
        this.render();
        this.visible = true;
    }

    /**
     * handle the change of the source (in 2nd tab)
     */
    loadSource(newSource: any) {
        this.file.source = newSource;
        this.renderModel();
        this.saveModel(this.file);
    }

    /**
     * 
     * @param {TypeFile} file 
     */
    saveModel(file: TypeFile) {
        file.source = file.definition?.toXML();
        file.save();
    }

    /**
     * Search for same file in ancestors
     * @param {string} typeRef
     * @param {JQuery<HTMLElement>} container
     * @returns {string} cyclePath
    */
    isCycleDetected(typeRef: string, container: JQuery<HTMLElement>): string {
        let data = null;
        let cyclePath = typeRef;
        do {
            data = /** @type {ContainerData} */ container.data('data');
            cyclePath = ((data && data.file && data.definition instanceof SchemaPropertyDefinition) ? data.file.fileName + '\n > ' : '') + cyclePath;
            if (data && data.file && data.file.fileName === typeRef) {
                return cyclePath;
            }
            container = container.parent();
        } while (container.length && data);
        return '';
    }
}

class ContainerData {
    /**
     * class for rendering a row in a table control for the schema
     * @param {XMLElementDefinition} definition 
     * @param {TypeFile} file 
     */
    constructor(public definition: XMLSerializable, public file: TypeFile) {
    }
}

