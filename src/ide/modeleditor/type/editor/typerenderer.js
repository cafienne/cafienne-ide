import CaseFileItemDragData from "@ide/dragdrop/casefileitemdragdata";
import CaseFileItemDef from "@repository/definition/cmmn/casefile/casefileitemdef";
import SchemaDefinition from "@repository/definition/type/schemadefinition";
import SchemaPropertyDefinition from "@repository/definition/type/schemapropertydefinition";
import TypeDefinition from "@repository/definition/type/typedefinition";
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
     * @param {TypeRenderer | undefined} source 
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
        this.schema.properties.forEach(property => this.addProperty(property));
        this.addEmptyProperty();
    }

    /**
     * 
     * @param {SchemaPropertyDefinition} property 
     */
    addProperty(property) {
        new PropertyRenderer(this, this.htmlContainer, this.localType, property).render();
    }

    addEmptyProperty() {
        this.addProperty(this.schema.createEmptyProperty());
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
        this.html = $(`<div class="property-renderer" />`);
        this.htmlParent.append(this.html);
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
        this.htmlContainer = $(`<div class='propertycontainer' title="${this.path}">
            <div>
                <img class="schemaPropertyIcon" style="width:14px;margin:2px;opacity:${this.property.isComplexType ? '1' : '0.2'}" src="/images/svg/casefileitem.svg"></img>
                <input class="inputPropertyName" value="${this.property.name}" />
                <button tabindex="-1" class="buttonRemoveProperty" title="Delete property"></button>
            </div>
            <div>
                <select class="selectType"></select>
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
                <input type="checkbox" class="inputBusinessIdentifier" ${this.property.isBusinessIdentifier ? ' checked' : ''} />
            </div>
            <div class="propertyschemacontainer schemacontainer"></div>
        </div>`);
        this.html.append(this.htmlContainer);

        this.htmlContainer.find('.buttonRemoveProperty').on('click', e => this.removeProperty());
        this.htmlContainer.find('.inputPropertyName').on('change', e => this.changeName(e.currentTarget.value));
        this.typeSelector = new TypeSelector(this.editor.ide.repository, this.htmlContainer.find('.selectType'), this.property.cmmnType, typeRef => this.changeType(typeRef), true);
        this.htmlContainer.find('.selectMultiplicity').on('change', e => this.changeProperty('multiplicity', e.currentTarget.value));
        this.htmlContainer.find('.selectMultiplicity').val(this.property.multiplicity);
        this.htmlContainer.find('.inputBusinessIdentifier').on('change', e => this.changeProperty('isBusinessIdentifier', e.currentTarget.checked));
        this.htmlContainer.find('.schemaPropertyIcon').on('pointerdown', e => {
            if (this.property.isComplexType && this.editor.case) {
                // Only support drag/drop for complex type
                e.preventDefault();
                e.stopPropagation();
                // Note: we can simply create a definition time and time again, as these CaseFileItemDef objects are not stored in the resulting xml of the case definition
                const cfi = this.editor.case.caseDefinition.createDefinition(CaseFileItemDef, undefined, this.path, this.name);
                this.editor.case.cfiEditor.startDragging(cfi);
            }
        });
        this.htmlContainer.on('keydown', e => e.stopPropagation());

        this.renderComplexTypeProperty();
    }

    renderComplexTypeProperty() {
        // Clear previous content of the schema container (if present)
        const schemaContainer = this.htmlContainer.find('>.schemacontainer');
        Util.clearHTML(schemaContainer);
        schemaContainer.css('display', 'none');
        // Clear previous cycle detected message (if present)
        this.htmlContainer.find('.selectType').css('border', '');
        this.htmlContainer.find('.selectType').attr('title', '');
        if (this.property.isComplexType) {
            if (this.property.type === 'object' && this.property.schema) {
                new SchemaRenderer(this, schemaContainer, this.localType, this.property.schema).render();
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
                        this.ide.repository.load(typeRef).then(file => {
                            const nestedLocalType = this.localType.root.registerLocalDefinition(file);
                            new SchemaRenderer(this, schemaContainer, nestedLocalType).render();
                        });
                    }
                }
            }
        }
    }

    removeProperty() {
        // remove the attribute (and all nested embedded attriute from the activeDefinition and the html table
        if (this.property['isNew']) {
            return;
        }
        // remove from the definition
        Util.removeFromArray(/** @type {SchemaDefinition} */(this.property.parent).properties, this.property);
        // remove from the html
        Util.removeHTML(this.htmlContainer);
        this.localType.save(this);
    }

    changeName(newName) {
        this.changeProperty('name', newName);
    }

    changeType(newType) {
        this.changeProperty('cmmnType', newType);
        this.renderComplexTypeProperty();
    }

    /**
     * 
     * @param {String} propertyName
     * @param {String} propertyValue 
     */
    changeProperty(propertyName, propertyValue) {
        const oldPropertyValue = this.property[propertyName];
        this.property[propertyName] = propertyValue;
        if (this.property.isNew) {
            // No longer transient parameter
            this.property.isNew = false;
            const schema = /** @type {SchemaDefinition} */ (this.property.parent);
            schema.properties.push(this.property);
            this.parent.addEmptyProperty();
        }
        if (oldPropertyValue != propertyValue) {
            this.localType.save(this);
        }
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
