'use strict';

class TypeModelEditor extends ModelEditor {
    /**
     * This editor handles type models; only validates the xml
     * @param {TypeFile} file The ServerFile to be loaded. E.g. 'customer.type', 'order.type'
     */

    constructor(file) {
        super(file);
        this.file = file;
        this.biTooltip = 'Cases and Tasks can be queried on business identifiers.\nThe identifiers are tracked in a separate index, but adding identifiers does have a performance impact';
        this.generateHTML();
    }

    get label() {
        return 'Edit Type - ' + this.fileName;
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
            </div>
        `);

        // add the type editor html to the splitter area
        this.htmlContainer.append(html);

        // add change handler for the name
        this.html.find('.inputDefinitionName').on('change', e => this.change('name', e.currentTarget.value));

        // add the tab control
        this.htmlContainer.find('.model-source-tabs').tabs({
            activate: (e, ui) => {
                if (ui.newPanel.hasClass('model-source-editor')) {
                    this.viewSourceEditor.render(XML.prettyPrint(this.file['activeDefinition'].toXML()));
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
     */
    change(propertyName, propertyValue) {
        this.file['activeDefinition'][propertyName] = propertyValue;
        this.saveModel(this.file);
    }

    render() {
        // Render name and definitionType
        this.htmlContainer.find('.inputDefinitionName').val(this.file['activeDefinition'].name);
        this.renderSchema(this.file['activeDefinition'].schema, this.file, this.html.find('.typeschemacontainer'));
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
            container.data('data', new ContainerData(schema, file));
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
            <div><button class="buttonRemoveType" title="removeType"></button><input class="inputTypeName" value="${property.name}" /></div>
            <div><select class="selectType">
                    <option value=""></option>
                    <option value="http://www.omg.org/spec/CMMN/PropertyType/string">string</option>
                    <option value="http://www.omg.org/spec/CMMN/PropertyType/boolean">boolean</option>
                    <option value="http://www.omg.org/spec/CMMN/PropertyType/integer">integer</option>
                    <option value="http://www.omg.org/spec/CMMN/PropertyType/float">float</option>
                    <option value="http://www.omg.org/spec/CMMN/PropertyType/time">time</option>
                    <option value="http://www.omg.org/spec/CMMN/PropertyType/date">date</option>
                    <option value="http://www.omg.org/spec/CMMN/PropertyType/dateTime">dateTime</option>
                    <option value="http://www.omg.org/spec/CMMN/PropertyType/anyURI">anyURI</option>
                    <option value="http://www.omg.org/spec/CMMN/PropertyType/QName">QName</option>
<!-- These elements not (yet) supported

                    <option value="http://www.omg.org/spec/CMMN/PropertyType/double">double</option>
                    <option value="http://www.omg.org/spec/CMMN/PropertyType/duration">duration</option>
                    <option value="http://www.omg.org/spec/CMMN/PropertyType/gYearMonth">gYearMonth</option>
                    <option value="http://www.omg.org/spec/CMMN/PropertyType/gYear">gYear</option>
                    <option value="http://www.omg.org/spec/CMMN/PropertyType/gMonthDay">gMonthDay</option>
                    <option value="http://www.omg.org/spec/CMMN/PropertyType/gDay">gDay</option>
                    <option value="http://www.omg.org/spec/CMMN/PropertyType/hexBinary">hexBinary</option>
                    <option value="http://www.omg.org/spec/CMMN/PropertyType/base64Binary">base64Binary</option>
                    <option value="http://www.omg.org/spec/CMMN/PropertyType/decimal">decimal</option>
-->
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
        html.data('data', new ContainerData(property, file));
        html.find('.inputTypeName').on('change', e => this.changeProperty('name', e.currentTarget.value, property, file, html));
        html.find('.selectType').on('change', e => this.changeProperty('type', e.currentTarget.value, property, file, html));
        html.find('.selectType').val(property.type);
        html.find('.selectMultiplicity').on('change', e => this.changeProperty('multiplicity', e.currentTarget.value, property, file, html));
        html.find('.selectMultiplicity').val(property.multiplicity);
        html.find('.inputBusinessIdentifier').on('change', e => this.changeProperty('isBusinessIdentifier', e.currentTarget.checked, property, file, html));
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
                        this.ide.danger(tooltip, 5000);
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
        if (property['isNew']) {
            // No longer transient parameter
            property['isNew'] = false;
            const schema = /** @type {SchemaDefinition} */ (property.parent);
            schema.properties.push(property);
            this.renderProperty(this.createPropertyTemplate(schema), file, html.parent());  
        }
        const oldPropertyValue = property[propertyName];
        property[propertyName] = propertyValue;
        if (oldPropertyValue != propertyValue) {
            this.saveModel(file);
            if (propertyName === 'type') {
                this.renderComplexTypeProperty(property, file, html);
            }
        }
    }

    onShow() {
        //always start with editor tab
        this.html.find('.model-source-tabs').tabs('option', 'active', 0);
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
     * @returns {string} cyclePath
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
}

class ContainerData {
    /**
     * class for rendering a row in a table control for the schema
     * @param {XMLElementDefinition} definition 
     * @param {TypeFile} file 
     */
    constructor(definition, file) {
        this.definition = definition;
        this.file = file;
    }
}

class TypeModelEditorMetadata extends ModelEditorMetadata {
    /** @returns {Array<ServerFile>} */
    get modelList() {
        return this.ide.repository.getTypes();
    }

    get modelType() {
        return 'type';
    }

    /** @returns {Function} */
    get shapeType() {
        return CaseFileItem;
    }

    get description() {
        return 'Types';
    }

    /**
     * Create a new CaseFileItem model with given name and description 
     * @param {IDE} ide 
     * @param {String} name 
     * @param {String} description 
     * @param {Function} callback
     * @returns {String} fileName of the new model
     */
    createNewModel(ide, name, description, callback = (/** @type {String} */ fileName) => { }) {
        const fileName = name + '.type';
        const newModelContent = `<type id="${fileName}" name="${name}"><schema/></type>`;
        ide.repository.createTypeFile(fileName, newModelContent).save(() => callback(fileName));
        return fileName;
    }
}

IDE.registerEditorType(new TypeModelEditorMetadata());
