import $ from "jquery";
import CaseFileDefinition from "../../../../repository/definition/cmmn/casefile/casefiledefinition";
import CaseFileItemDef from "../../../../repository/definition/cmmn/casefile/casefileitemdef";
import CaseFileItemTypeDefinition from "../../../../repository/definition/cmmn/casefile/casefileitemtypedefinition";
import Multiplicity from "../../../../repository/definition/type/multiplicity";
import SchemaDefinition from "../../../../repository/definition/type/schemadefinition";
import SchemaPropertyDefinition from "../../../../repository/definition/type/schemapropertydefinition";
import TypeFile from "../../../../repository/serverfile/typefile";
import Util from "../../../../util/util";
import IDE from "../../../ide";
import HtmlUtil from "../../../util/htmlutil";
import Images from "../../../util/images/images";
import Shapes from "../../../util/images/shapes";
import ModelEditorMetadata from "../../modeleditormetadata";
import TypeModelEditorMetadata from "../typemodeleditormetadata";
import LocalTypeDefinition from "./localtypedefinition";
import PropertyUsage from "./propertyusage";
import TypeEditor from "./typeeditor";
import TypeSelector from "./typeselector";

const expandSign = '&nbsp>&nbsp';
const collapseSign = '&nbsp--&nbsp';

export default abstract class TypeRenderer {

    /**
     * All current in-memory renderers, used for refreshing
     */
    static renderers: TypeRenderer[] = [];
    ide: IDE;
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

    constructor(public editor: TypeEditor, public parent: TypeRenderer | undefined, public localType: LocalTypeDefinition, public definition: SchemaPropertyDefinition | SchemaDefinition, public htmlParent: JQuery<HTMLElement>) {
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

    abstract refresh(): void;

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
    constructor(editor: TypeEditor, public parent: PropertyRenderer | undefined, public htmlContainer: JQuery<HTMLElement>, localType: LocalTypeDefinition, public schema = localType.definition.schema) {
        super(editor, parent, localType, schema, htmlContainer);
    }

    render() {
        this.htmlContainer.css('display', 'block');
        this.schema.properties.forEach(property => this.createPropertyRenderer(property));
    }

    createPropertyRenderer(property: SchemaPropertyDefinition): PropertyRenderer {
        const newPropertyRenderer = new PropertyRenderer(this, this.htmlContainer, this.localType, property);
        newPropertyRenderer.render();
        return newPropertyRenderer;
    }

    addEmptyPropertyRenderer(sibling?: PropertyRenderer): PropertyRenderer {
        const newProperty = this.schema.createChildProperty();
        const newPropertyRenderer = this.createPropertyRenderer(newProperty);
        if (sibling) {
            this.schema.insert(newPropertyRenderer.property, sibling.property);
            newPropertyRenderer.html.insertAfter(sibling.html);
        }

        // Also add the new property to the case file definitions that have a reference us.
        //  Note: "that reference us." ==> this means reference either to TypeDefinition or SchemaPropertyDefinition surrounding "us", "us" being the SchemaDefinition
        this.schema.searchInboundReferences().forEach(reference => {
            if (reference instanceof CaseFileItemTypeDefinition || reference instanceof CaseFileDefinition) {
                reference.addChild(newProperty);
            }
        });

        return newPropertyRenderer;
    }

    refresh() {
        this.children.forEach(child => child.delete());
        HtmlUtil.clearHTML(this.htmlContainer);
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
    inputPropertyName?: JQuery<HTMLElement>;
    propertyContainer?: JQuery<HTMLElement>;
    schemaRenderer?: SchemaRenderer;

    constructor(public parent: SchemaRenderer, htmlParent: JQuery<HTMLElement>, localType: LocalTypeDefinition, public property: SchemaPropertyDefinition) {
        super(parent.editor, parent, localType, property, htmlParent);
        this.html = $('<div class="property-renderer" />');
        this.htmlParent.append(this.html);
    }

    select() {
        this.propertyContainer?.addClass('property-selected');
    }

    deselect() {
        this.propertyContainer?.removeClass('property-selected');
    }

    renderComplexOrPrimitiveTypeStyle() {
        if (this.property.isComplexType) {
            this.propertyContainer?.addClass('complex-type');
            this.propertyContainer?.removeClass('primitive-type');
        } else {
            this.propertyContainer?.addClass('primitive-type');
            this.propertyContainer?.removeClass('complex-type');
        }
    }

    delete() {
        if (this.typeSelector) {
            this.typeSelector.delete();
        }
        super.delete();
    }

    refresh() {
        HtmlUtil.clearHTML(this.htmlContainer);
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
                        <label class="btnCollapse" style="display:none;width:12px" expanded="0">${collapseSign}</label>
                        <img class="cfi-icon" src="${Shapes.CaseFileItem}"></img>
                        <input class="inputPropertyName"  type="text" readonly value="${this.property.name}" />
                        <div class="action-icon-container">
                            <img class="action-icon delete-icon" src="${Images.Delete}" title="Delete ..."/>
                            <img class="action-icon add-sibling-icon" src="${Images.AddSiblingNode}" title="Add sibling ..."/>
                            <img class="action-icon add-child-icon" src="${Images.AddChildNode}" title="Add child ..."/>
                        </div>
                    </div>
                    <div class="select-container">
                        <select class="selectType"></select>
                    </div>
                    <div class="select-container">
                        <select class="selectMultiplicity">
                            ${Multiplicity.values.map(m => '<option value="' + m.value + '">' + m.label + '</option>')}
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
        if (!this.htmlContainer) return;
        this.htmlContainer.find('.add-child-icon').on('click', e => this.editor.addChild(e, this));
        this.htmlContainer.find('.add-sibling-icon').on('click', e => this.editor.addSibling(e, this));
        this.htmlContainer.find('.delete-icon').on('click', e => this.removeProperty());

        this.typeSelector = new TypeSelector(this.editor.ide.repository, this.htmlContainer.find('.selectType'), this.property.cmmnType, (typeRef: string) => this.changeType(typeRef), true, [{ option: '&lt;new&gt;', value: '<new>' }]);
        this.htmlContainer.find('.selectMultiplicity').on('change', e => this.changeProperty('multiplicity', Multiplicity.parse((e.currentTarget as any).value)));
        this.htmlContainer.find('.selectMultiplicity').val(this.property.multiplicity.toString());
        this.htmlContainer.find('.checkboxBusinessIdentifier').on('change', e => this.changeProperty('isBusinessIdentifier', (e.currentTarget as any).checked));
        this.htmlContainer.find('.cfi-icon').on('pointerdown', e => {
            if (this.property.isComplexType && this.editor.case) {
                // Only support drag/drop for complex type
                e.preventDefault();
                e.stopPropagation();
                // Note: we can simply create a definition time and time again, as these CaseFileItemDef objects are not stored in the resulting xml of the case definition
                const cfi: CaseFileItemDef = this.editor.case.caseDefinition.createDefinition(CaseFileItemDef, undefined, this.path, this.name);
                this.editor.case.cfiEditor.startDragging(cfi);
            }
        });
        // ??? Why is this here? this.htmlContainer.on('keydown', e => e.stopPropagation());
        this.inputPropertyName?.on('change', e => this.changeName((e.currentTarget as any).value));
        this.inputPropertyName?.on('keyup', e => {
            if (e.which === 9) { // Tab to get inputName focus
                this.editor.selectPropertyRenderer(this);
                this.inputNameFocusHandler();
            }
        });
        this.inputPropertyName?.on('leave', () => this.inputNameBlurHandler());
        this.inputPropertyName?.on('blur', () => this.inputNameBlurHandler());
        this.inputPropertyName?.on('dblclick', () => this.inputNameFocusHandler());
        this.inputPropertyName?.on('click', () => this.inputNameFocusHandler());
        this.propertyContainer?.on('click', e => {
            e.stopPropagation();
            this.editor.selectPropertyRenderer(this);
        });

        const cb = this.htmlContainer.find('.btnCollapse');
        const sc = this.htmlContainer.find('>.schema-container');
        this.htmlContainer.find('.btnCollapse').on('click', e => {
            const plus = cb.attr('expanded') === '0' ? '1' : '0';
            const newSign = plus === '1' ? expandSign : collapseSign;
            cb.html(newSign);
            cb.attr('expanded', plus);
            this.renderContainer();
        });
    }

    renderContainer() {
        if (!this.htmlContainer) return;
        const cb = this.htmlContainer.find('.btnCollapse');
        const sc = this.htmlContainer.find('>.schema-container');
        if (cb.attr('expanded') === '1') {
            sc.css('display', 'none');
        } else {
            sc.css('display', 'block');
        }
    }

    inputNameBlurHandler() {
        (this.inputPropertyName as any).attr('readonly', true);
        document.getSelection()?.empty();
    }

    inputNameFocusHandler() {
        if (this.editor.selectedPropertyRenderer === this) {
            (this.inputPropertyName as any)?.attr('readonly', false);
            this.inputPropertyName?.select();
        }
    }

    async renderComplexTypeProperty() {
        if (!this.htmlContainer) return;
        // Clear previous content of the schema container (if present)
        const schemaContainer = this.htmlContainer.find('>.schema-container');
        HtmlUtil.clearHTML(schemaContainer);
        schemaContainer.css('display', 'none');
        // Clear previous cycle detected message (if present)
        this.htmlContainer.find('.selectType').css('border', '');
        this.htmlContainer.find('.selectType').attr('title', '');
        this.renderComplexOrPrimitiveTypeStyle();
        if (this.property.isComplexType) {
            this.htmlContainer.find('.btnCollapse').css('display', '');
            if (this.property.type === 'object' && this.property.schema) {
                this.schemaRenderer = new SchemaRenderer(this.editor, this, schemaContainer, this.localType, this.property.schema);;
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
                        const file: TypeFile = await this.ide.repository.load(typeRef);
                        const nestedLocalType = this.localType.root?.registerLocalDefinition(file);
                        if (nestedLocalType) {
                            this.schemaRenderer = new SchemaRenderer(this.editor, this, schemaContainer, nestedLocalType);
                            this.schemaRenderer.render();
                        }
                    }
                }
            }
            this.renderContainer();
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
        // Also update the in-memory case definitions that a child is removed.
        this.property.getCaseFileItemReferences().forEach(reference => reference.removeDefinition());

        // remove from the html
        HtmlUtil.removeHTML(this.htmlContainer);
        this.localType.save(this);
    }

    async changeName(newName: string) {
        await PropertyUsage.updateNameChangeInOtherModels(this, newName);
        if (!this.property.type) {
            // Auto detect type  (Eg.: if name is changed into "greeting" search and propoese existing type "Greeting.type")
            const type = this.editor.ide.repository.getTypes().find(definition => definition.name.toLowerCase() == this.property.name.toLowerCase());
            if (type) {
                this.changeType(type.fileName);
                this.htmlContainer?.find('.selectType').first().val(type.fileName);
            }
        }
        this.changeProperty('name', newName);
    }

    async changeType(newType: string) {
        if (newType === '<new>') {
            // If <new> is selected create a new Type in repository
            const newTypeModelName = this.__getUniqueTypeName(this.property.name);
            const typeModelEditorMetadata: TypeModelEditorMetadata = <TypeModelEditorMetadata>ModelEditorMetadata.types.find(type => type.fileType === 'type');
            if (typeModelEditorMetadata) {
                const newTypeFileName = await typeModelEditorMetadata.createNewModel(this.ide, newTypeModelName, '');
                this.htmlContainer?.find('.selectType').first().val(newTypeFileName);
                if (this.typeSelector) this.typeSelector.typeRef = newTypeFileName;
                this.changeProperty('cmmnType', newTypeFileName);
                await this.renderComplexTypeProperty();
                // Trigger adding a new (empty) child for easy data entry
                this.editor.addChild(jQuery.Event(''), this);
            }
        } else {
            if (this.typeSelector) this.typeSelector.typeRef = newType;
            this.changeProperty('cmmnType', newType);
            await this.renderComplexTypeProperty();
            if (newType === 'object') {
                // Trigger adding a new (empty) child for easy data entry
                this.editor.addChild(jQuery.Event(''), this);
            }
        }
    }

    /**
     * Creates a non-existing name for the new type,
     * i.e., one that does not conflict with the existing list of type models.
     * @param typeModelName the name of the type model without the .type filename extension 
     */
    __getUniqueTypeName(typeModelName: string): string {
        while (this.ide.repository.hasFile(typeModelName + '.type')) {
            typeModelName = this.__nextName(typeModelName);
        }
        return typeModelName;
    }

    /**
     * Returns the next name for the specified string; it checks the last
     * characters. For a name like 'abc' it will return 'abc_1', for 'abc_1' it returns 'abc_2', etc.
     */
    __nextName(proposedName: string): string {
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

    changeProperty(propertyName: string, propertyValue: any) {
        (this.property as any)[propertyName] = propertyValue;
        const schema = /** @type {SchemaDefinition} */ (this.property.parent);
        const indexOfProperty = schema.properties.indexOf(this.property);
        if (indexOfProperty === schema.properties.length - 1 && this.editor.quickEditMode) {
            // if in edit mode: insert an empty transient placeholder property (this is for users convenience while adding multiple new properties) 
            this.parent.addEmptyPropertyRenderer(this);
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
