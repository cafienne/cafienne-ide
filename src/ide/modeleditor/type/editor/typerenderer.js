import { CaseFileItemDragData } from "@ide/dragdata";
import IDE from "@ide/ide";
import CaseFileItemDef from "@repository/definition/cmmn/casefile/casefileitemdef";
import SchemaDefinition from "@repository/definition/type/schemadefinition";
import SchemaPropertyDefinition from "@repository/definition/type/schemapropertydefinition";
import TypeFile from "@repository/serverfile/typefile";
import { andThen } from "@util/promise/followup";
import SequentialFollowupList from "@util/promise/sequentialfollowuplist";
import Util from "@util/util";
import $ from "jquery";
import LocalTypeDefinition from "./localtypedefinition";
import TypeEditor from "./typeeditor";
import TypeSelector from "./typeselector";

export default class TypeRenderer {

    /**
     * All current in-memory renderers, used for refreshing
     * @type {Array<TypeRenderer>}
     */
    static renderers = [];

    /**
     * Register a new renderer. Includes code smell check when a similar renderer is already registered in the same editor with the same path.
     * @param {TypeRenderer} renderer 
     */
    static register(renderer) {
        const similar = other => {
            if (!other) return false;
            if (renderer === other) return true;
            if (renderer.constructor.name !== other.constructor.name) return false;
            if (renderer.editor !== other.editor) return false;
            if (renderer.localType !== other.localType) return false;
            return renderer.path === other.path;
        }

        if (this.renderers.find(similar)) {
            console.warn('Cannot add renderer again found ' + renderer.constructor.name + ' ' + renderer)
            return;
        }
        this.renderers.push(renderer);
    }

    /**
     * Remove a renderer from the cache.
     * @param {TypeRenderer} renderer 
     */
    static remove(renderer) {
        // console.log('Removing ' + renderer);
        Util.removeFromArray(this.renderers, renderer);
    }

    /**
     * 
     * @param {TypeRenderer} source 
     */
    static refreshOthers(source) {
        // Editor filter finds all other editors that render the same type definition as the source does. If source is not present, all editors are refreshed.
        const editorFilter = renderer => source === undefined || renderer.editor !== source.editor && renderer.localType.sameFile(source.localType);

        const otherEditors = this.renderers.filter(editorFilter).map(r => r.editor).filter((value, index, self) => index === self.findIndex((t) => t === value));
        otherEditors.forEach(editor => editor.refresh());

        if (source) {
            // If we have a source renderer, we should only refresh the other renderers on the same definition.
            const otherRenderersOnThisType = this.renderers.filter(other => other.editor === source.editor && other !== source && other.definition === source.definition);
            // We refresh the parent, because the refresh logic appends it's own property again, instead of re-using the property container inside the parent.
            otherRenderersOnThisType.forEach(r => r.refresh());
        }
    }

    /**
     * 
     * @param {TypeEditor|TypeRenderer} parent 
     * @param {LocalTypeDefinition} localType 
     * @param {SchemaPropertyDefinition|SchemaDefinition} definition 
     * @param {JQuery<HTMLElement>} htmlParent 
     */
    constructor(parent, localType, definition, htmlParent) {
        this.parent = parent instanceof TypeRenderer ? parent : undefined;
        this.editor = parent instanceof TypeEditor ? parent : parent.editor;
        this.ide = this.editor.ide;
        this.localType = localType;
        this.definition = definition;
        this.htmlParent = htmlParent;
        /** @type {Array<TypeRenderer>} */
        this.children = [];
        if (this.parent) {
            this.parent.children.push(this);
        }
        TypeRenderer.register(this);
    }

    delete() {
        this.orphan = true;
        this.children.forEach(child => child.delete());
        this.children = [];
        TypeRenderer.remove(this);
        this.parent = undefined;
    }

    /**
     * 
     * @returns {Array<TypeRenderer>}
     */
    getDescendents() {
        return [this, ...this.children.map(child => child.getDescendents()).flat()];
    }

    /**
     * Returns true if the potential child has us as an ancestor;
     * @param {TypeRenderer} potentialChild 
     * @returns {Boolean}
     */
    hasDescendent(potentialChild) {
        if (potentialChild) {
            if (potentialChild.parent === this) return true;
            return this.hasDescendent(potentialChild.parent);
        } else {
            return false;
        }
    }

    hasAncestor(potentialAncestor) {
        if (potentialAncestor) {
            if (this.parent) {
                if (this.parent === potentialAncestor) return true;
                return this.parent.hasAncestor(potentialAncestor);
            }
        }
        return false;
    }

    /**
     * Returns true if the typeRef is available as type in this renderer.
     * @param {PropertyRenderer} source
     * @param {String} typeRef 
     */
    hasCycle(source, typeRef) {
        if (this.parent) {
            return this.parent.hasCycle(source, typeRef);
        } else {
            return undefined;
        }
    }

    refresh() {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    get propertyName() {
        if (this.definition instanceof SchemaPropertyDefinition) {
            return this.definition.name;
        } else {
            return this.parent ? this.parent.propertyName : '';
        }
    }

    get name() {
        if (this.definition instanceof SchemaPropertyDefinition) {
            return this.definition.name;
        } else {
            return '';
        }
    }

    get path() {
        const parentPaths = [];
        let ancestor = this.parent;
        while (ancestor) {
            parentPaths.push(ancestor.name);
            ancestor = ancestor.parent;
        }
        const parent = parentPaths.filter(p => p !== '').reverse().join('/');
        return parent.length > 0 ? parent + '/' + this.name : this.name;
    }

    get prefix() {
        return this.editor.case ? 'Case ' + this.editor.case.editor.fileName : 'Type editor of ' + this.editor.mainType.file.fileName;;
    }

    toString() {
        return `${this.path} in ${this.prefix} on main type ${this.localType.file.fileName}`
    }

}

export class SchemaRenderer extends TypeRenderer {
    /**
     * 
     * @param {TypeEditor|PropertyRenderer} parent 
     * @param {LocalTypeDefinition} localType 
     * @param {SchemaDefinition} schema 
     * @param {JQuery<HTMLElement>} htmlParent 
     */
    constructor(parent, htmlParent, localType, schema = localType.definition.schema) {
        super(parent, localType, schema, htmlParent);
        this.htmlContainer = htmlParent;
        this.schema = schema;
    }

    render() {
        this.htmlContainer.css('display', 'block');
        this.schema.properties.forEach(property => this.createPropertyRenderer(property));
    }

    /**
     * 
     * @param {SchemaPropertyDefinition} property 
     * @returns {PropertyRenderer}
     */
    createPropertyRenderer(property) {
        const newPropertyRenderer = new PropertyRenderer(this, this.htmlContainer, this.localType, property);
        newPropertyRenderer.render();
        return newPropertyRenderer;
    }

    /**
     * 
     * @param {PropertyRenderer} sibling 
     * @returns {PropertyRenderer}
     */
    addEmptyPropertyRenderer(sibling = null) {
        const newPropertyRenderer = this.createPropertyRenderer(this.schema.createChildProperty());
        if (sibling) {
            const definition = newPropertyRenderer.property;
            this.schema.insert(newPropertyRenderer.property, sibling.property);
            newPropertyRenderer.html.insertAfter(sibling.html);
        }
        return newPropertyRenderer;    
    }

    refresh() {
        this.children.forEach(child => child.delete());
        Util.clearHTML(this.htmlContainer);
        this.render();
    }

    /**
     * Returns true if the typeRef is available as type in this renderer.
     * @param {PropertyRenderer} source
     * @param {String} typeRef 
     */
    hasCycle(source, typeRef) {
        if (this.schema === this.localType.definition.schema && this.localType.file.fileName === typeRef) {
            if (source.parent === this) {
                return 'Property ' + source.name + ' in ' + typeRef + ' cannot refer to its own type';
            } else if (this.parent) {
                return 'Property ' + source.name + ' uses ' + typeRef + ', but that type is also used in ' + this.propertyName;
            } else {
                return 'Property ' + source.name + ' uses ' + typeRef + ', but that is the main type';
            }
        } else {
            return super.hasCycle(source, typeRef);
        }
    }
}

export class PropertyRenderer extends TypeRenderer {
    /**
     * 
     * @param {SchemaRenderer} parent 
     * @param {LocalTypeDefinition} localType 
     * @param {SchemaPropertyDefinition} property 
     * @param {JQuery<HTMLElement>} htmlParent 
     */
    constructor(parent, htmlParent, localType, property) {
        super(parent, localType, property, htmlParent);
        this.parent = parent;
        this.property = property;
        this.editor.propertyRenderers.push(this);
        this.html = $('<div class="property-renderer" />');
        this.htmlParent.append(this.html);
        /** @type {SchemaRenderer} */
        this.schemaRenderer = null;
    }

    select() {
        this.propertyContainer.addClass('property-selected');
    }

    deselect() {
        this.propertyContainer.removeClass('property-selected');
    }

    renderComplexOrPrimitiveTypeStyle() {
        if (this.property.isComplexType) {
            this.propertyContainer.addClass('complex-type');
            this.propertyContainer.removeClass('primitive-type');
        } else {
            this.propertyContainer.addClass('primitive-type');
            this.propertyContainer.removeClass('complex-type');
        }
    }

    delete() {
        if (this.typeSelector) {
            this.typeSelector.delete();
        }
        super.delete();
    }

    refresh() {
        Util.clearHTML(this.htmlContainer);
        if (this.typeSelector) {
            this.typeSelector.delete();
        }
        this.render();
    }

    render() {
        this.htmlContainer = $(
            `<div>
                <div class='property-container' title="${this.path}">
                    <div class="input-name-container">
                        <img class="cfi-icon" src="/images/svg/casefileitem.svg"></img>
                        <input class="inputPropertyName"  type="text" readonly value="${this.property.name}" />
                        <div class="action-icon-container">
                            <img class="action-icon delete-icon" src="images/delete_32.png" title="Delete ..."/>
                            <img class="action-icon add-sibling-icon" src="images/svg/add-sibling-node.svg" title="Add sibling ..."/>
                            <img class="action-icon add-child-icon" src="images/svg/add-child-node.svg" title="Add child ..."/>
                        </div>
                    </div>
                    <div class="select-container">
                        <select class="selectType"></select>
                    </div>
                    <div class="select-container">
                        <select class="selectMultiplicity">
                            <option value="ExactlyOne">[1]</option>
                            <option value="ZeroOrOne">[0..1]</option>
                            <option value="ZeroOrMore">[0..*]</option>
                            <option value="OneOrMore">[1..*]</option>
                            <option value="Unspecified">[*]</option>
                            <option value="Unknown">[?]</option>
                        </select>
                    </div>
                    <div class="checkbox-container" style="text-align:center">
                        <input type="checkbox" class="checkboxBusinessIdentifier" ${this.property.isBusinessIdentifier ? ' checked' : ''} />
                    </div>
                </div>
                <div class="property-children-container schema-container"></div>
            </div>`
        );
        this.html.append(this.htmlContainer);
        this.inputPropertyName = this.htmlContainer.find('.inputPropertyName');
        this.propertyContainer = this.htmlContainer.find('.property-container');

        this.attachEventHandlers();
        this.renderComplexTypeProperty();
    }

    attachEventHandlers() {
        this.htmlContainer.find('.add-child-icon').on('click', e => this.editor.addChild(e, this));
        this.htmlContainer.find('.add-sibling-icon').on('click', e => this.editor.addSibling(e, this));
        this.htmlContainer.find('.delete-icon').on('click', e => this.removeProperty());

        this.typeSelector = new TypeSelector(this.editor.ide.repository, this.htmlContainer.find('.selectType'), this.property.cmmnType, typeRef => this.changeType(typeRef), true, [{ option: '&lt;new&gt;', value: '<new>' }]);
        this.htmlContainer.find('.selectMultiplicity').on('change', e => this.changeProperty('multiplicity', e.currentTarget.value));
        this.htmlContainer.find('.selectMultiplicity').val(this.property.multiplicity);
        this.htmlContainer.find('.checkboxBusinessIdentifier').on('change', e => this.changeProperty('isBusinessIdentifier', e.currentTarget.checked));
        this.htmlContainer.find('.cfi-icon').on('pointerdown', e => {
            if (this.property.isComplexType && this.editor.case) {
                // Only support drag/drop for complex type
                e.preventDefault();
                e.stopPropagation();
                const cfi = this.editor.case.caseDefinition.createDefinition(CaseFileItemDef, undefined, this.path, this.name);
                this.editor.case.cfiEditor.dragData = new CaseFileItemDragData(this.editor, cfi);
            } else {
                this.ide.warning('Cannot drag items here', 1000)
            }
        });
        // ??? Why is this here? this.htmlContainer.on('keydown', e => e.stopPropagation());
        this.inputPropertyName.on('change', e => this.changeName(e.currentTarget.value));
        this.inputPropertyName.on('keyup', e => {
            if (e.which === 9) { // Tab to get inputName focus
                this.editor.selectPropertyRenderer(this);
                this.inputNameFocusHandler();
            }
        });
        this.inputPropertyName.on('leave', () => this.inputNameBlurHandler());
        this.inputPropertyName.on('blur', () => this.inputNameBlurHandler());
        this.inputPropertyName.on('dblclick', () => this.inputNameFocusHandler());
        this.inputPropertyName.on('click', () => this.inputNameFocusHandler());
        this.propertyContainer.on('click', e => {
            e.stopPropagation();
            this.editor.selectPropertyRenderer(this);
        });
    }

    inputNameBlurHandler() {
        this.inputPropertyName.attr('readonly', true);
        document.getSelection().empty();
    }

    inputNameFocusHandler() {
        if (this.editor.selectedPropertyRenderer === this) {
            this.inputPropertyName.attr('readonly', false);
            this.inputPropertyName.select();
        }
    }

    renderComplexTypeProperty() {
        // Clear previous content of the schema container (if present)
        const schemaContainer = this.htmlContainer.find('>.schema-container');
        Util.clearHTML(schemaContainer);
        schemaContainer.css('display', 'none');
        // Clear previous cycle detected message (if present)
        this.htmlContainer.find('.selectType').css('border', '');
        this.htmlContainer.find('.selectType').attr('title', '');
        this.renderComplexOrPrimitiveTypeStyle();
        if (this.property.isComplexType) {
            if (this.property.type === 'object' && this.property.schema) {
                this.schemaRenderer = new SchemaRenderer(this, schemaContainer, this.localType, this.property.schema);;
                this.schemaRenderer.render();
            } else {
                const typeRef = this.property.typeRef;
                const typeFile = this.ide.repository.getTypes().find(type => type.fileName === typeRef);
                if (typeFile) {
                    const cycleDetected = this.parent.hasCycle(this, typeRef);
                    if (cycleDetected) {
                        const tooltip = `Cycle detected<br/><br/>${cycleDetected}`;
                        this.ide.danger(tooltip, 4000);
                        this.htmlContainer.find('.selectType').css('border', '2px solid red');
                        this.htmlContainer.find('.selectType').attr('title', 'Cycle detected\n\n' + cycleDetected);
                    } else {
                        this.ide.repository.load(typeRef, andThen((/** @type {TypeFile} */file) => {
                            const nestedLocalType = this.localType.root.registerLocalDefinition(file);
                            this.schemaRenderer = new SchemaRenderer(this, schemaContainer, nestedLocalType);
                            this.schemaRenderer.render();
                        }));
                    }
                }
            }
        }
    }

    /**
     * Remove the property (including nested objects)
     * But first check if the property is still in use. If so, then it cannot be removed.
     */
    removeProperty() {
        // First check direct references, as that gives a different error message than child properties.
        const references = this.property.getCaseReferences();
        if (references.length > 0) {
            const definitionsUsing = Util.removeDuplicates(references.map(ref => ref.modelDefinition.file.fileName));
            this.editor.ide.warning('Cannot remove property, as it is in use in ' + references.length + ' places across the files ' + definitionsUsing.map(fileName => `<br />- ${fileName}`).join(''));
            return;
        }

        // Now check references to one of our descendents. Also they are not allowed.
        const childRenderers = this.getDescendents().filter(child => child instanceof PropertyRenderer).map((/** @type {PropertyRenderer} */child) => child.property);
        const childCaseReferences = Util.removeDuplicates(childRenderers.filter(p => p !== this.property && p.getCaseReferences().length > 0));
        if (childCaseReferences.length > 0) {
            this.editor.ide.warning('Cannot remove property, as it has child properties that are in use' + childCaseReferences.map(property => `<br />- ${property.name}`).join(''));
            return;
        }

        // remove from the definition
        Util.removeFromArray(/** @type {SchemaDefinition} */(this.property.parent).properties, this.property);
        // remove from the html
        Util.removeHTML(this.htmlContainer);
        this.localType.save(this);
    }

    changeName(newName) {
        // First track both the old and new name.
        const oldName = this.property.name;
        const oldPath = this.path;
        // Set the new name on the property, but do not yet save the definition
        this.property.name = newName;
        const newPath = this.path;

        // Now process all case models that have a reference to this property.
        //  Step 1: change the case file item that wraps the property
        //  Step 2: check if the change leads to changes in CaseDefinition or Dimensions (only if the cfi is used in the model)
        //  Step 3: save those changes, in a sequential order, and keep track of the files that have been changed
        //  Step 4: save the local type
        //  Step 5: refresh the editors

        console.groupCollapsed('Processing name change');
        const references = /** @type {Array<CaseFileItemTypeDefinition> } */ (this.property.searchInboundReferences().filter(element => element instanceof CaseFileItemTypeDefinition));
        const filesToReload = /** @type Array<CaseFile> */[];
        const list = new SequentialFollowupList(andThen(() => {
            console.groupEnd();
            // filesToReload.filter(file => file instanceof DimensionsFile).forEach(file => file.reload());
            filesToReload.filter(file => file instanceof CaseFile).forEach(file => {
                const editor = this.editor.ide.editors.find(editor => editor.file.fileName === file.fileName)
                if (editor) {
                    if (editor.visible) {
                        editor.refresh();
                    } else {
                        editor.destroy();
                    }
                } else {
                    console.log('Reloading file ' + file.fileName);
                    file.reload();
                }
            });
            this.localType.save(this);
        }));
        references.forEach(cfi => {
            const caseFile = cfi.caseDefinition.file;
            const dimensionsFile = caseFile.definition.dimensions.file;

            const caseXMLBefore = XML.prettyPrint(caseFile.definition.toXML());
            const dimXMLBefore = XML.prettyPrint(dimensionsFile.definition.toXML());

            cfi.updatePaths(this.property, oldName, newName);

            const caseXML = XML.prettyPrint(caseFile.definition.toXML());
            const dimXML = XML.prettyPrint(dimensionsFile.definition.toXML());

            const hasCaseDefinitionChanges = caseXMLBefore !== caseXML;
            const hasDimensionChanges = dimXMLBefore !== dimXML;

            if (hasCaseDefinitionChanges || hasDimensionChanges) {
                filesToReload.push(caseFile);
            }

            if (hasDimensionChanges) {
                list.add(callback => {
                    dimensionsFile.source = dimXML;
                    dimensionsFile.save(andThen(() => callback()));
                });
            }
            if (hasCaseDefinitionChanges) {
                list.add(callback => {
                    caseFile.source = caseXML;
                    caseFile.save(andThen(() => callback()));
                });
            }
        });
        list.run();

        if (!this.property.type) {
            // Auto detect type  (Eg.: if name is changed into "greeting" search and propoese existing type "Greeting.type")
            const type = this.editor.ide.repository.getTypes().find(definition => definition.name.toLowerCase() == this.property.name.toLowerCase());
            if (type) {
                this.changeType(type.fileName);
                this.htmlContainer.find('.selectType').first().val(type.fileName);
            }
        }
    }

    changeType(newType) {
        if (newType === '<new>') {
            // If <new> is selected create a new Type in repository
            const newTypeModelName = this.__getUniqueTypeName(this.property.name);
            const typeModelEditorMetadata = IDE.editorTypes.find(type => type.modelType === 'type');
            if (typeModelEditorMetadata) {
                typeModelEditorMetadata.createNewModel(this.ide, newTypeModelName, '', newTypeFileName => {
                    this.htmlContainer.find('.selectType').first().val(newTypeFileName);
                    this.typeSelector.typeRef = newTypeFileName;
                    this.changeProperty('cmmnType', newTypeFileName);
                    this.renderComplexTypeProperty();
                    // Trigger adding a new (empty) child for easy data entry
                    this.editor.addChild(jQuery.Event(''), this);
                });
            }
        } else {
            this.typeSelector.typeRef = newType;
            this.changeProperty('cmmnType', newType);
            this.renderComplexTypeProperty();
            if ( newType === 'object') {
                // Trigger adding a new (empty) child for easy data entry
                this.editor.addChild(jQuery.Event(''), this);
            }
        }
    }

    /**
     * Creates a non-existing name for the new type,
     * i.e., one that does not conflict with the existing list of type models.
     * @param {string} typeModelName the name of the type model without the .type filename extension 
     * @returns {string}
     */
    __getUniqueTypeName(typeModelName) {
        while (this.ide.repository.isExistingModel(typeModelName + '.type')) {
            typeModelName = this.__nextName(typeModelName);
        }
        return typeModelName;
    }

    /**
     * Returns the next name for the specified string; it checks the last
     * characters. For a name like 'abc' it will return 'abc_1', for 'abc_1' it returns 'abc_2', etc.
     * @returns {String}
     */
    __nextName(proposedName) {
        const underscoreLocation = proposedName.indexOf('_');
        if (underscoreLocation < 0) {
            return proposedName + '_1';
        } else {
            const front = proposedName.substring(0, underscoreLocation + 1);
            const num = new Number(proposedName.substring(underscoreLocation + 1)).valueOf() + 1;
            const newName = front + num;
            return newName;
        }
    }

    /**
     * 
     * @param {String} propertyName
     * @param {String} propertyValue 
     */
    changeProperty(propertyName, propertyValue) {
        this.property[propertyName] = propertyValue;
        if (this.property.isNew) {
            // The property is no longer a new transient placeholder property because the value is changed and it can become persistent
            this.property.isNew = false;
            const schema = /** @type {SchemaDefinition} */ (this.property.parent);
            const indexOfProperty = schema.properties.indexOf(this.property);
            if (indexOfProperty === schema.properties.length - 1 || !schema.properties[indexOfProperty + 1].isNew) {
                // if not yet there: insert an empty transient placeholder property (this is for users convenience while adding multiple new properties) 
                this.parent.addEmptyPropertyRenderer(this);
            }
        }
        this.localType.save(this);
    }

    /**
     * Returns true if the typeRef is available as type in this renderer.
     * @param {PropertyRenderer} source
     * @param {String} typeRef 
     */
    hasCycle(source, typeRef) {
        if (this.property.type === typeRef) {
            return 'Property in use';
        } else {
            return super.hasCycle(source, typeRef);
        }
    }
}
