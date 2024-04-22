import SchemaPropertyDefinition from "@repository/definition/type/schemapropertydefinition";
import LocalTypeDefinition from "./localtypedefinition";
import SchemaRenderer from "./schemarenderer";
import TypeRenderer from "./typerenderer";
import Util from "@util/util";
import { CaseFileItemDragData } from "@ide/dragdata";
import TypeFile from "@repository/serverfile/typefile";
import SchemaDefinition from "@repository/definition/type/schemadefinition";
import TypeSelector from "./typeselector";

export default class PropertyRenderer extends TypeRenderer {
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
                const cfi = this.editor.case.caseDefinition.createDefinition(CaseFileItemDef, this.path, this.name);
                this.editor.case.cfiEditor.dragData = new CaseFileItemDragData(this.editor, cfi);
            } else {
                this.ide.warning('Cannot drag items here', 1000)
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
                        this.ide.repository.load(typeRef, andThen((/** @type {TypeFile} */file) => {
                            const nestedLocalType = this.localType.root.registerLocalDefinition(file);
                            new SchemaRenderer(this, schemaContainer, nestedLocalType).render();
                        }));
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

        console.groupCollapsed("Processing name change");
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
                    console.log("Reloading file " + file.fileName)
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
        this.property[propertyName] = propertyValue;
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

class PropertyDragData extends DragData {
    constructor(editor, property, path) {
        super(editor.ide, editor, property.name, SchemaPropertyDefinition.name, '/images/svg/casefileitem.svg', property.id);
        this.item = property;
        this.path = path;
    }
}
