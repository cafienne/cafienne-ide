import IDE from "@ide/ide";
import CaseFileItemDef from "@repository/definition/cmmn/casefile/casefileitemdef";
import SchemaDefinition from "@repository/definition/type/schemadefinition";
import SchemaPropertyDefinition from "@repository/definition/type/schemapropertydefinition";
import TypeFile from "@repository/serverfile/typefile";
import Util from "@util/util";
import $ from "jquery";
import LocalTypeDefinition from "./localtypedefinition";
import PropertyUsage from "./propertyusage";
import TypeEditor from "./typeeditor";
import TypeSelector from "./typeselector";
import TypeFile from "@repository/serverfile/typefile";

export default class TypeRenderer {

    /**
     * All current in-memory renderers, used for refreshing
     */
    static renderers: TypeRenderer[] = [];
    ide: IDE;
    parent: TypeRenderer | undefined;
    editor: TypeEditor;
    children: TypeRenderer[];
    orphan: boolean = false;

    /**
     * Register a new renderer. Includes code smell check when a similar renderer is already registered in the same editor with the same path.
     */
    static register(renderer: TypeRenderer) {
        const similar = (other?: TypeRenderer) => {
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
     */
    static remove(renderer: TypeRenderer) {
        // console.log('Removing ' + renderer);
        Util.removeFromArray(this.renderers, renderer);
    }

    static refreshOthers(source?: TypeRenderer) {
        // Editor filter finds all other editors that render the same type definition as the source does. If source is not present, all editors are refreshed.
        const editorFilter = (renderer: TypeRenderer) => source === undefined || renderer.editor !== source.editor && renderer.localType.sameFile(source.localType);

        const otherEditors = this.renderers.filter(editorFilter).map(r => r.editor).filter((value, index, self) => index === self.findIndex((t) => t === value));
        otherEditors.forEach(editor => editor.refresh());

        if (source) {
            // If we have a source renderer, we should only refresh the other renderers on the same definition.
            const otherRenderersOnThisType = this.renderers.filter(other => other.editor === source.editor && other !== source && other.definition === source.definition);
            // We refresh the parent, because the refresh logic appends it's own property again, instead of re-using the property container inside the parent.
            otherRenderersOnThisType.forEach(r => r.refresh());
        }
    }

    constructor(parent: TypeEditor | TypeRenderer, public localType: LocalTypeDefinition, public definition: SchemaPropertyDefinition | SchemaDefinition, public htmlParent: JQuery<HTMLElement>) {
        this.parent = parent instanceof TypeRenderer ? parent : undefined;
        this.editor = parent instanceof TypeEditor ? parent : parent.editor;
        this.ide = this.editor.ide;
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

    getDescendents(): TypeRenderer[] {
        return [this, ...this.children.map(child => child.getDescendents()).flat()];
    }

    /**
     * Returns true if the potential child has us as an ancestor;
     */
    hasDescendent(potentialChild?: TypeRenderer): boolean {
        if (potentialChild) {
            if (potentialChild.parent === this) return true;
            return this.hasDescendent(potentialChild.parent);
        } else {
            return false;
        }
    }

    hasAncestor(potentialAncestor?: TypeRenderer): boolean {
        if (potentialAncestor) {
            if (this.parent) {
                if (this.parent === potentialAncestor) return true;
                return this.parent.hasAncestor(potentialAncestor);
            }
        }
        return false;
    }

    /**
     * Returns a string with the description if the typeRef is available as type in this renderer.
     * Else returns an empty string.
     */
    hasCycle(source: PropertyRenderer, typeRef: string): string {
        if (this.parent) {
            return this.parent.hasCycle(source, typeRef);
        } else {
            return '';
        }
    }

    refresh() {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    get propertyName(): string {
        if (this.definition instanceof SchemaPropertyDefinition) {
            return this.definition.name;
        } else {
            return this.parent ? this.parent.propertyName : '';
        }
    }

    get name(): string {
        if (this.definition instanceof SchemaPropertyDefinition) {
            return this.definition.name;
        } else {
            return '';
        }
    }

    get path(): string {
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
        return this.editor.case ? 'Case ' + this.editor.case.editor.fileName : 'Type editor of ' + this.editor.mainType?.file.fileName;;
    }

    toString() {
        return `${this.path} in ${this.prefix} on main type ${this.localType.file.fileName}`
    }
}

export class SchemaRenderer extends TypeRenderer {
    constructor(parent: PropertyRenderer | TypeEditor, public htmlContainer: JQuery<HTMLElement>, localType: LocalTypeDefinition, public schema = localType.definition.schema) {
        super(parent, localType, schema, htmlContainer);
    }

    render() {
        this.htmlContainer.css('display', 'block');
        this.schema.properties.forEach(property => this.addProperty(property));
        this.addEmptyProperty();
    }

    addProperty(property: SchemaPropertyDefinition) {
        new PropertyRenderer(this, this.htmlContainer, this.localType, property).render();
    }

    addEmptyProperty() {
        this.addProperty(this.schema.createChildProperty());
    }

    refresh() {
        this.children.forEach(child => child.delete());
        Util.clearHTML(this.htmlContainer);
        this.render();
    }

    /**
     * Returns true if the typeRef is available as type in this renderer.
     */
    hasCycle(source: PropertyRenderer, typeRef: string): string {
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
    html: JQuery<HTMLElement>;
    htmlContainer?: JQuery<HTMLElement>;
    typeSelector?: TypeSelector;

    constructor(public parent: SchemaRenderer, htmlParent: JQuery<HTMLElement>, localType: LocalTypeDefinition, public property: SchemaPropertyDefinition) {
        super(parent, localType, property, htmlParent);
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
                <img class="schemaPropertyIcon" style="width:14px;margin:2px;opacity:${this.property.isComplexType ? '1' : '0.2'}" src="images/svg/casefileitem.svg"></img>
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
        this.htmlContainer.find('.inputPropertyName').on('change', e => this.changeName((e.currentTarget as any).value));
        this.typeSelector = new TypeSelector(this.editor.ide.repository, this.htmlContainer.find('.selectType'), this.property.cmmnType, (typeRef: string) => this.changeType(typeRef), true);
        this.htmlContainer.find('.selectMultiplicity').on('change', e => this.changeProperty('multiplicity', (e.currentTarget as any).value));
        this.htmlContainer.find('.selectMultiplicity').val(this.property.multiplicity);
        this.htmlContainer.find('.inputBusinessIdentifier').on('change', e => this.changeProperty('isBusinessIdentifier', (e.currentTarget as any).checked));
        this.htmlContainer.find('.schemaPropertyIcon').on('pointerdown', e => {
            if (this.property.isComplexType && this.editor.case) {
                // Only support drag/drop for complex type
                e.preventDefault();
                e.stopPropagation();
                // Note: we can simply create a definition time and time again, as these CaseFileItemDef objects are not stored in the resulting xml of the case definition
                const cfi: CaseFileItemDef = this.editor.case.caseDefinition.createDefinition(CaseFileItemDef, undefined, this.path, this.name);
                this.editor.case.cfiEditor.startDragging(cfi);
            }
        });
        this.htmlContainer.on('keydown', e => e.stopPropagation());

        this.renderComplexTypeProperty();
    }

    async renderComplexTypeProperty() {
        if (!this.htmlContainer) return;
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
                        const file: TypeFile = await this.ide.repository.load(typeRef);
                        const nestedLocalType = this.localType.root?.registerLocalDefinition(file);
                        if (nestedLocalType) new SchemaRenderer(this, schemaContainer, nestedLocalType).render();
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
        if (!PropertyUsage.checkPropertyDeletionAllowed(this)) {
            return;
        }

        // remove from the definition
        Util.removeFromArray(this.property.parent.properties, this.property);
        // remove from the html
        Util.removeHTML(this.htmlContainer);
        this.localType.save(this);
    }

    async changeName(newName: string) {
        await PropertyUsage.updateNameChangeInOtherModels(this, newName);
        await this.localType.save(this);
    }

    changeType(newType: string) {
        this.changeProperty('cmmnType', newType);
        this.renderComplexTypeProperty();
    }

    changeProperty(propertyName: string, propertyValue: string) {
        (this.property as any)[propertyName] = propertyValue;
        if (this.property.isNew) {
            // No longer transient parameter
            this.property.isNew = false;
            const schema = /** @type {SchemaDefinition} */ (this.property.parent);
            schema.properties.push(this.property);
            this.parent.addEmptyProperty();
        }
        this.localType.save(this);
    }

    /**
     * Returns true if the typeRef is available as type in this renderer.
     */
    hasCycle(source: PropertyRenderer, typeRef: string): string {
        if (this.property.type === typeRef) {
            return 'Property in use';
        } else {
            return super.hasCycle(source, typeRef);
        }
    }
}
