'use strict';

class TypeEditor {
    /**
     * Edit the Type definition
     * @param {IDE} ide 
     * @param {TypeFile} file 
     * @param {JQuery<HTMLElement>} htmlParent 
     */

    constructor(ide, file, htmlParent) {
        this.ide = ide;
        this.htmlContainer = htmlParent;
        this.biTooltip = 'Cases and Tasks can be queried on business identifiers.\nThe identifiers are tracked in a separate index, but adding identifiers does have a performance impact';
        this.file = file;
        this.generateHTML();
    }    

    get label() {
        return 'Edit Type - ' + this.file.fileName;
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

        // add the type editor html to the splitter area
        this.htmlContainer.append(html);

        // add change handler for the name
        this.htmlContainer.find('.inputDefinitionName').on('change', e => this.change('name', e.currentTarget.value));

        // add the tab control
        this.htmlContainer.find('.model-source-tabs').tabs({
            activate: (e, ui) => {
                if (ui.newPanel.hasClass('model-source-editor')) {
                    this.viewSourceEditor.render(XML.prettyPrint(this.file['activeDefinition'].toXML()));
                }
                if (ui.newPanel.hasClass('json-schema-editor')) {
                    this.jsonSchemaEditor.setValue(JSON.stringify(this.file['activeDefinition'].toJSONSchema(), null, 2));
                }
            }
        });

        this.htmlContainer.find('.model-source-tabs').tabs('enable', 1);

        //add the source part
        this.viewSourceEditor = new ModelSourceEditor(this.htmlContainer.find('.model-source-tabs .model-source-editor'), this);

        //add the JSON Schema part
        this.createJSONSchemaEditor();
    }

    createJSONSchemaEditor() {
        //add code mirror JSON style
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
                // this.file['activeDefinition'].parseJSONSchema(JSON.parse(this.jsonSchemaEditor.getValue()));
                // this.saveModel(this.file);
                this.ide.warning('Parsing changes in JSON Schema not implemented');
            }
        });
        this.jsonSchemaEditor.on('change', () => {this._changed = true;});
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
     */
    change(propertyName, propertyValue) {
        this.file['activeDefinition'][propertyName] = propertyValue;
        this.saveModel(this.file);
    }

    render() {
        // Render name and definitionType
        this.htmlContainer.find('.inputDefinitionName').val(this.file['activeDefinition'].name);
        this.renderSchema(this.file['activeDefinition'].schema, this.file, this.htmlContainer.find('.typeschemacontainer'));
    }

    /**
     * The template property in UI table to add a new property in schema
     * @param {SchemaDefinition} schema
     * @returns {SchemaPropertyDefinition}
     */
    createPropertyTemplate(schema) {
        // create a new, empty parameter at the end of the types
        const property = schema.createDefinition(SchemaPropertyDefinition);
        property.name = '';
        property.type = '';
        property.isBusinessIdentifier = false;
        property.multiplicity = 'ExactlyOne';
        property['isNew'] = true;
        return property;
    }

    /**
     * 
     * @param {SchemaDefinition} schema
     * @param {TypeFile} file 
     * @param {JQuery<HTMLElement>} container 
     */
    renderSchema(schema, file, container) {
        Util.clearHTML(container);
        if (schema) {
            container.data('data', new ContainerData(container, schema, file));
            container.css('display', 'block');
            schema.properties.forEach(type => this.renderProperty(type, file, container));
            this.renderProperty(this.createPropertyTemplate(schema), file, container);    
        }
    }

    /**
     * 
     * @param {SchemaPropertyDefinition} property
     * @param {TypeFile} file 
     * @param {JQuery<HTMLElement>} container
     * @returns {JQuery<HTMLElement>}
     */
    renderProperty(property, file, container) {
        const html = $(`<div class='propertycontainer'>
            <div><img class="schemaPropertyIcon" style="width:14px;margin:2px" src="/images/svg/casefileitem.svg"></img><input class="inputTypeName" value="${property.name}" /><button tabindex="-1" class="buttonRemoveType" title="Delete property"></button></div>
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
        html.find('.buttonRemoveType').on('click', e => {
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
        html.data('data', new ContainerData(container, property, file));
        html.find('.inputTypeName').on('change', e => this.changeProperty('name', e.currentTarget.value, property, file, html));
        html.find('.selectType').on('change', e => this.changeProperty('type', e.currentTarget.value, property, file, html));
        html.find('.selectType').val(property.type);
        html.find('.selectMultiplicity').on('change', e => this.changeProperty('multiplicity', e.currentTarget.value, property, file, html));
        html.find('.selectMultiplicity').val(property.multiplicity);
        html.find('.inputBusinessIdentifier').on('change', e => this.changeProperty('isBusinessIdentifier', e.currentTarget.checked, property, file, html));
        html.find('.schemaPropertyIcon').on('pointerdown', e => {
            e.preventDefault();
            e.stopPropagation();
            this.handleDragStartProperty(property, html);
        });
        html.on('keydown', e => {
            e.stopPropagation();
        });

        this.renderComplexTypeProperty(property, file, html);
        return html;
    }

    /**
     * 
     * @param {SchemaPropertyDefinition} property 
     * @param {TypeFile} file 
     * @param {JQuery<HTMLElement>} container 
     */
    renderComplexTypeProperty(property, file, container) {
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
                        this.ide.repository.load(typeRef, file => {
                            const nestedTypeDefinition = file.definition;
                            file['activeDefinition'] = nestedTypeDefinition; // Keep pointer to our active unsaved editor definition
                            this.renderSchema(nestedTypeDefinition.schema, file, schemaContainer);
                        });
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
    changeProperty(propertyName, propertyValue, property, file, html) {
        const oldPropertyValue = property[propertyName];
        property[propertyName] = propertyValue;
        if (property['isNew']) {
            // No longer transient parameter
            property['isNew'] = false;
            const schema = /** @type {SchemaDefinition} */ (property.parent);
            schema.properties.push(property);
            SchemaPropertyDefinition.setSchemaPropertyCache(property);
            this.renderProperty(this.createPropertyTemplate(schema), file, html.parent());  
        }
        if (oldPropertyValue != propertyValue) {
            this.saveModel(file);
            if (propertyName === 'type') {
                this.renderComplexTypeProperty(property, file, html);
            }
            //TODO update container data
        }
    }

    onShow() {
        //always start with editor tab
        this.htmlContainer.find('.model-source-tabs').tabs('option', 'active', 0);
    }

    loadModel() {
        this.file.load(()=>this.renderModel());
    }

    renderModel() {
        this.file['activeDefinition'] = this.file.definition; // Keep pointer to our active unsaved editor definition
        this.render();
        this.visible = true;
    }

    /**
     * handle the change of the source (in 2nd tab)
     */
    loadSource(newSource) {
        this.file.source = newSource;
        this.renderModel();
        this.saveModel(this.file);
    }

    /**
     * 
     * @param {TypeFile} file 
     */
    saveModel(file) {
        file.source = file['activeDefinition'].toXML();
        file.save();
    }

    /**
     * Search for same file in ancestors
     * @param {string} typeRef
     * @param {JQuery<HTMLElement>} container
    */
    isCycleDetected(typeRef, container) {
        let data = null;
        let cyclePath = typeRef;
        do {
            data = /** @type {ContainerData} */ container.data('data');
            cyclePath = ((data && data.file && data.definition instanceof SchemaPropertyDefinition) ? data.file.fileName + '\n > ' : '') + cyclePath;
            if (data && data.file && data.file.fileName === typeRef ) {
                return cyclePath;
            }
            container = container.parent();
        } while (container.length && data);
        return '';
    }
    
    /**
     * Handles the dragging of a case file item from the cfi editor to a zoom field (cfi field)
     * @param {SchemaPropertyDefinition} property
     * @param {JQuery<HTMLElement>} html 
     */
    handleDragStartProperty(property, html) {
        this.dragData = new PropertyDragData(this, property, /** @type {ContainerData} */ html.data('data').path);
    }
    
    /**
     * Registers a function handler that is invoked upon dropping an element.
     * If an item from the editor is moved over the canvas, elements and form properties can register themselves as a drop handler
     * @param {Function} dropHandler
     * @param {Function} filter
     */
    setDropHandler(dropHandler, filter = undefined) {
        if (this.dragData) this.dragData.setDropHandler(dropHandler, filter);
    }

    /**
     * Removes the active drop handler and filter
     */
    removeDropHandler() {
        if (this.dragData) this.dragData.removeDropHandler();
    }

    /**
     * 
     * @param {string} path
     * @returns {SchemaPropertyDefinition} 
     */
    getSchemaPropertyDefinitionWithPath(path) {
        const foundContainer = this.htmlContainer.find('.schemacontainer .propertycontainer').filter( (index, element) => $(element).data('data').path === path);
        return foundContainer && foundContainer.length && foundContainer.data('data').definition;
    }
}

class PropertyDragData extends DragData {
    constructor(editor, property, path) {
        super(editor.ide, editor, property.name, SchemaPropertyDefinition.name, '/images/svg/casefileitem.svg', property.id);
        this.item = property;
        this.path = path;
    }
}

class ContainerData {
    /**
     * class for rendering a row in a table control for the schema
     * @param {JQuery<HTMLElement>} container
     * @param {XMLElementDefinition} definition 
     * @param {TypeFile} file 
     */
    constructor(container, definition, file) {
        this.definition = definition;
        this.file = file;
        // Calculation of path;
        if (definition instanceof SchemaPropertyDefinition) {
            let path = definition.name;
            let data = null;
            do {
                data = /** @type {ContainerData} */ container.data('data');
                path = ((data && data.file && data.definition instanceof SchemaPropertyDefinition) ? data.definition.name + '/' : '') + path;
                container = container.parent();
            } while (container.length && data);
            this.path = path;
        }
    }
}

