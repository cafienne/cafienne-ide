'use strict';

class TypeEditor {
    /**
     * Edit the Type definition
     * @param {IDE} ide 
     * @param {TypeFile} file 
     * @param {JQuery<HTMLElement>} htmlParent 
     * @param {CaseView} cs 
     */
    constructor(ide, file, htmlParent, cs = undefined) {
        this.ide = ide;
        this.htmlContainer = htmlParent;
        this.case = cs;
        this.biTooltip = 'Cases and Tasks can be queried on business identifiers.\nThe identifiers are tracked in a separate index, but adding identifiers does have a performance impact';
        this.file = file;
        this.files = {};
        this.mainType = this.registerLocalDefinition(file);
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

        // add change handler for the name of the root type
        this.htmlContainer.find('.inputDefinitionName').on('change', e => {
            this.mainType.definition.name = e.currentTarget.value;
            this.mainType.save();
        });

        this.htmlTypeSchemaContainer = this.htmlContainer.find('.typeschemacontainer')

        // add the tab control
        this.htmlContainer.find('.model-source-tabs').tabs({
            activate: (e, ui) => {
                const activeDefinition = this.mainType.definition;
                if (ui.newPanel.hasClass('model-source-editor')) {
                    this.viewSourceEditor.render(XML.prettyPrint(activeDefinition.toXML()));
                }
                if (ui.newPanel.hasClass('json-schema-editor')) {
                    this.jsonSchemaEditor.setValue(JSON.stringify(activeDefinition.toJSONSchema(), null, 2));
                }
            }
        });

        this.htmlContainer.find('.model-source-tabs').tabs('enable', 1);

        //add the source part
        this.viewSourceEditor = new ModelSourceEditor(this.htmlContainer.find('.model-source-tabs .model-source-editor'), this);

        //add the JSON Schema part
        this.createJSONSchemaEditor();
    }

    /**
     * 
     * @param {TypeFile} file 
     * @returns {LocalTypeDefinition}
     */
    registerLocalDefinition(file) {
        if (!file) {
            return;
        }
        if (!this.files[file.fileName]) {
            this.files[file.fileName] = new LocalTypeDefinition(this, file);
        }
        return this.files[file.fileName];
    }

    /**
     * 
     * @param {String} typeRef 
     * @returns {TypeDefinition}
     */
    getActiveDefinition(typeRef) {
        return this.getLocalTypeDefinition(typeRef).definition;
    }

    /**
     * 
     * @param {String} typeRef 
     * @returns {LocalTypeDefinition}
     */
    getLocalTypeDefinition(typeRef) {
        return this.files[typeRef];
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
        this.jsonSchemaEditor.on('change', () => { this._changed = true; });
    }

    render() {
        // Render name and definitionType
        this.htmlContainer.find('.inputDefinitionName').val(this.mainType.definition.name);
        this.renderer = new SchemaRenderer(this, this.mainType, this.mainType.definition.schema, this.htmlTypeSchemaContainer);
        this.renderer.render();
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
        this.htmlContainer.find('.model-source-tabs').tabs('option', 'active', 0);
    }

    loadModel() {
        this.file.load(() => this.renderModel());
    }

    renderModel() {
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
        file.source = this.getLocalTypeDefinition(file.fileName).definition.toXML();
        file.save();
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
     * @param {DragData} dragData 
     */
    setDragData(dragData) {
        this.dragData = dragData;
    }

    /**
     * 
     * @param {string} path
     * @returns {SchemaPropertyDefinition} 
     */
    getSchemaPropertyDefinitionWithPath(path) {
        return SchemaPropertyDefinition.getSchemaPropertyFromCache(path);
    }
}
