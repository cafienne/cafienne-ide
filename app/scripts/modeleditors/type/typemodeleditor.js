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
                                <div>
                                    <label>Default Multiplicity</label>
                                    <select class="selectDefaultMultiplicity">
                                        <option value="ExactlyOne">[1]</option>
                                        <option value="ZeroOrOne">[0..1]</option>
                                        <option value="ZeroOrMore">[0..*]</option>
                                        <option value="OneOrMore">[1..*]</option>
                                        <option value="Unspecified">[*]</option>
                                        <option value="Unknown">[?]</option>
                                    </select>
                                </div>
                            </div>
                            <div class="typecontainer">
                                <div class="typeTreeTable">
                                    <div class="divTable">
                                    </div>
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
        this.html.find('.selectDefaultMultiplicity').on('change', e => this.change('multiplicity', e.currentTarget.value));

        // html node having the details of the type
        this.tableDiv = this.html.find('.divTable');

        // add the tab control
        this.htmlContainer.find('.model-source-tabs').tabs({
            activate: (e, ui) => {
                if (ui.newPanel.hasClass('model-source-editor')) {
                    this.viewSourceEditor.render(XML.prettyPrint(this.file.definition.toXML()));
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
    change(propertyName, propertyValue, element = this.file.definition) {
        element[propertyName] = propertyValue;
        this.saveModel();
    }

    render() {
        // Render name and definitionType
        this.htmlContainer.find('.inputDefinitionName').val(this.file.definition.name);
        this.htmlContainer.find('.selectDefaultMultiplicity').val(this.file.definition.multiplicity);

        // Render table content
        Util.clearHTML(this.tableDiv);
        this.tableDiv.html(`
            <table>
                <colgroup>
                    <col class="typeNamecol" width="350px"></col>
                    <col class="typecol" width="180px"></col>
                    <col class="typeMultiplicitycol" width="80px"></col>
                    <col class="typeBusinessIdentifier" width="1px"></col>
                </colgroup>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Multiplicity</th>
                        <th title="${this.biTooltip}">Business Identifier</th>
                    </tr>
                </thead>
                <tbody>
                </tbody>
            </table>
        `);
        this.file.definition.types.forEach(type => this.renderRow(type, this.file, 0));
        this.renderRow(this.createTypeTemplate(this.file.definition), this.file, 0);
    }

    /**
     * The template type in UI table to add a new type
     * @param {TypeDefinition} parentType
     * @return {TypeDefinition}
     */
    createTypeTemplate(parentType) {
        // create a new, empty parameter at the end of the types (at this level)
        const type = parentType.createDefinition(TypeDefinition);
        type.name = '';
        type.type = '';
        type.isBusinessIdentifier = false;
        type.multiplicity = 'ExactlyOne';
        type['isNew'] = true;
        return type;
    }

    /**
     * 
     * @param {TypeDefinition} type 
     * @param {ServerFile} file 
     * @param {number} level 
     */
    renderRow(type, file, level) {
        const html = $(`<tr>
            <td style="padding-left:${level * 20}px"><button class="buttonRemoveType" title="removeType"></button><input style="width: ${320 - (level * 20)}px" class="inputTypeName" value="${type.name}" /></td>
            <td><select class="selectType">
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
            </td>
            <td>
                <select class="selectMultiplicity">
                    <option value="ExactlyOne">[1]</option>
                    <option value="ZeroOrOne">[0..1]</option>
                    <option value="ZeroOrMore">[0..*]</option>
                    <option value="OneOrMore">[1..*]</option>
                    <option value="Unspecified">[*]</option>
                    <option value="Unknown">[?]</option>
                </select>
            </td>
            <td style="text-align:center">
                <input type="checkbox" class="inputBusinessIdentifier" ${type.isBusinessIdentifier ? ' checked' : ''} />
            </td>
        </tr>`);
        html.find('.buttonRemoveType').on('click', e => {
            if (type['isNew']) {
                return;
            }
            Util.removeFromArray(/** @type {TypeDefinition} */(type.parent).types, type);
            Util.removeHTML(html);
            this.saveModel(type);
        });
        html.find('.inputTypeName').on('change', e => this.changeType('name', e.currentTarget.value, type));
        html.find('.selectType').on('change', e => this.changeType('type', e.currentTarget.value, type));
        html.find('.selectType').val(type.type);
        html.find('.selectMultiplicity').on('change', e => this.changeType('multiplicity', e.currentTarget.value, type));
        html.find('.selectMultiplicity').val(type.multiplicity);
        html.find('.inputBusinessIdentifier').on('change', e => this.changeType('isBusinessIdentifier', e.currentTarget.checked, type));
        this.html.find('tbody').append(html);
        type['file'] = file;
        if (type.isComplexType) {
            if (type.type == 'object') {
                type.types.forEach(type => this.renderRow(type, file, level + 1));
                this.renderRow(this.createTypeTemplate(type), file, level + 1);
            } else {
                if (this.ide.repository.get(type.typeRef)) {
                    if (this.isCycleDetected(type.typeRef)) {
                        const tooltip = `Cycle detected!, Type '${type.typeRef}'`;
                        this.ide.danger(tooltip, 5000);
                        html.find('.selectType').css('border','2px solid red');
                        html.find('.selectType').attr('title',tooltip);
                    } else {
                        this.ide.repository.load(type.typeRef, file => {
                            file.definition.types.forEach(type => this.renderRow(type, file, level + 1));
                            this.renderRow(this.createTypeTemplate(file.definition), file, level + 1);
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
     * @param {TypeDefinition} type
     */
    changeType(propertyName, propertyValue, type) {
        if (type['isNew']) {
            // No longer transient parameter
            type['isNew'] = false;
            /** @type {TypeDefinition} */ (type.parent).types.push(type);
        }
        const oldPropertyValue = type[propertyName];
        type[propertyName] = propertyValue;
        if (oldPropertyValue != propertyValue) {
            if (type !== 'object') {
                // clear embedded object descendants
                type.types = [];
            }
            this.saveModel(type);
        }
    }

    onShow() {
        //always start with editor tab
        this.html.find('.model-source-tabs').tabs('option', 'active', 0);
    }

    loadModel() {
        this.file.load(file => this.loadAllNestedModels([], file, () => this.renderModel()));
    }

    /**
     * 
     * @param {Array<String>} typeRefs 
     * @param {TypeFile} file 
     * @param {Function} callback 
     */
    loadAllNestedModels(typeRefs, file, callback) {
        const newTypes = file.definition.getDescendants().filter(type => type.typeRef).map(a => a.typeRef);
        const additionalTypesToLoad = newTypes.filter(a => typeRefs.indexOf(a) < 0);
        typeRefs.push(...additionalTypesToLoad);
        // TODO:  This implementation will fail and skip pre-loading of depeer nested types if parent-type is already pre-loaded and nested type not yet loaded.
        const next = typeRefs.find(ref => this.ide.repository.get(ref) && !this.ide.repository.get(ref).content.source);
        if (next) {
            this.ide.repository.get(next).load(file => this.loadAllNestedModels(typeRefs, file, callback));
        } else {
            callback();
        }
    }

    renderModel() {
        this._definition = this.file.definition;
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

    saveModel(type = undefined) {
        const file = type ? /** @type {ServerFile} */ (type['file']) : this.file;
        file.source = file.definition.toXML();
        file.save(() => {
            if (type) file.clear(); // Workaround to force loadAllNestedModels() will not skip pre-loading of nested types.
            this.refresh();
        });
    }

    /**
     * The serverfile maintains a usage list of 'where used' informataion.
     * @param {string} typeRef
     * @returns {boolean}
     */
    isCycleDetected(typeRef, level=0) {
        let cycleDetected = false
        if (level > 100) {
            cycleDetected = true;//Just use the javascript call stack size to detect a cycle (max depth = 100)
        } else {
            const file = this.ide.repository.get(typeRef);
            if (file) {
                file.usage.forEach(ref => { cycleDetected = cycleDetected || this.isCycleDetected(ref.id, level+1); });
            }
        }
        return cycleDetected;
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
        const newModelContent = `<type id="${fileName}" name="${name}"/>`;
        ide.repository.createTypeFile(fileName, newModelContent).save(() => callback(fileName));
        return fileName;
    }
}

IDE.registerEditorType(new TypeModelEditorMetadata());
