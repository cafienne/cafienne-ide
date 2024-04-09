class PropertyRenderer extends TypeRenderer {
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
                <img class="schemaPropertyIcon" style="width:14px;margin:2px;opacity:${this.property.isComplexType?'1':'0.2'}" src="/images/svg/casefileitem.svg"></img>
                <input class="inputTypeName" value="${this.property.name}" />
                <button tabindex="-1" class="buttonRemoveType" title="Delete property"></button>
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
        // this.    html.find('.propertyContainer');
        this.html.append(this.htmlContainer);

        this.htmlContainer.find('.buttonRemoveType').on('click', e => {
            // remove the attribute (and all nested embedded attriute from the activeDefinition and the html table
            if (this.property['isNew']) {
                return;
            }
            // remove from the definition
            Util.removeFromArray(/** @type {SchemaDefinition} */(this.property.parent).properties, this.property);
            // remove from the html
            Util.removeHTML(this.htmlContainer);
            this.localType.save(this);
        });
        this.typeSelector = new TypeSelector(this.editor, this.htmlContainer.find('.selectType'), this.property.type, typeRef => this.changeProperty('type', typeRef), true);
        this.htmlContainer.find('.inputTypeName').on('change', e => this.changeProperty('name', e.currentTarget.value));
        this.htmlContainer.find('.selectMultiplicity').on('change', e => this.changeProperty('multiplicity', e.currentTarget.value));
        this.htmlContainer.find('.selectMultiplicity').val(this.property.multiplicity);
        this.htmlContainer.find('.inputBusinessIdentifier').on('change', e => this.changeProperty('isBusinessIdentifier', e.currentTarget.checked));
        this.htmlContainer.find('.schemaPropertyIcon').on('pointerdown', e => {
            if (this.property.isComplexType && this.editor.case) {
                // Only support drag/drop for complex type
                e.preventDefault();
                e.stopPropagation();
                const cfi = this.editor.case.caseDefinition.createDefinition(CaseFileItemDef, this.path, '+' + this.name);        
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
                        this.ide.repository.load(typeRef, (/** @type {TypeFile} */file) => {
                            const nestedLocalType = this.localType.root.registerLocalDefinition(file);
                            new SchemaRenderer(this, schemaContainer, nestedLocalType).render();
                        });
                    }
                }
            }
        }
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
            if (propertyName === 'type') {
                this.renderComplexTypeProperty();
            }
        }
    }

    /**
     * Returns true if the typeRef is available as type in this renderer.
     * @param {PropertyRenderer} source
     * @param {String} typeRef 
     */
    hasCycle(source, typeRef) {
        if (this.property.type === typeRef) {
            return "Property in use";
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
