class PropertyRenderer extends TypeRenderer {
    /**
     * 
     * @param {SchemaRenderer} parent 
     * @param {LocalTypeDefinition} localType 
     * @param {SchemaPropertyDefinition} property 
     * @param {JQuery<HTMLElement>} htmlParent 
     */
    constructor(parent, localType, property, htmlParent) {
        super(parent, localType, property, htmlParent);
        this.parent = parent;
        this.property = property;
    }

    render() {
        if (this.html) {
            Util.clearHTML(this.html);
        }
        this.html = $(`<div class='propertycontainer' title="${this.path}">
        <div>
            <img class="schemaPropertyIcon" style="width:14px;margin:2px;opacity:${this.property.isComplexType?'1':'0.2'}" src="/images/svg/casefileitem.svg"></img>
            <input class="inputTypeName" value="${this.property.name}" />
            <button tabindex="-1" class="buttonRemoveType" title="Delete property"></button>
        </div>
        <div>
            <select class="selectType">
                <option value=""></option>
                <option value="string">string</option>
                <option value="number">number</option>
                <option value="integer">integer</option>
                <option value="boolean">boolean</option>
                <option value="object">object</option>
                ${this.editor.getOptionTypeHTML()}
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
            <input type="checkbox" class="inputBusinessIdentifier" ${this.property.isBusinessIdentifier ? ' checked' : ''} />
        </div>
        <div class="propertyschemacontainer schemacontainer">
        </div>
    </div>`);
        this.html.find('.buttonRemoveType').on('click', e => {
            // remove the attribute (and all nested embedded attriute from the activeDefinition and the html table
            if (this.property['isNew']) {
                return;
            }
            // remove from the definition
            Util.removeFromArray(/** @type {SchemaDefinition} */(this.property.parent).properties, this.property);
            // remove from the html
            Util.removeHTML(this.html);
            this.localType.savePropertyChange(this);
        });
        this.htmlParent.append(this.html);
        this.html.find('.inputTypeName').on('change', e => this.changeProperty('name', e.currentTarget.value));
        this.html.find('.selectType').on('change', e => this.changeProperty('type', e.currentTarget.value));
        this.html.find('.selectType').val(this.property.type);
        this.html.find('.selectMultiplicity').on('change', e => this.changeProperty('multiplicity', e.currentTarget.value));
        this.html.find('.selectMultiplicity').val(this.property.multiplicity);
        this.html.find('.inputBusinessIdentifier').on('change', e => this.changeProperty('isBusinessIdentifier', e.currentTarget.checked));
        this.html.find('.schemaPropertyIcon').on('pointerdown', e => {
            if (this.property.isComplexType) {
                // Only support drag/drop for complex type
                e.preventDefault();
                e.stopPropagation();
                this.editor.setDragData(new PropertyDragData(this, this.property, this.path));
            }
        });
        this.html.on('keydown', e => e.stopPropagation());

        this.renderComplexTypeProperty();
    }

    renderComplexTypeProperty() {
        // Clear previous content of the schema container (if present)
        const schemaContainer = this.html.find('>.schemacontainer');
        Util.clearHTML(schemaContainer);
        schemaContainer.css('display', 'none');
        // Clear previous cycle detected message (if present)
        this.html.find('.selectType').css('border', '');
        this.html.find('.selectType').attr('title', '');
        if (this.property.isComplexType) {
            if (this.property.type === 'object' && this.property.schema) {
                new SchemaRenderer(this, this.localType, this.property.schema, schemaContainer).render();
            } else {
                const typeRef = this.property.typeRef;
                const typeFile = this.ide.repository.getTypes().find(type => type.fileName === typeRef);
                if (typeFile) {
                    const cycleDetected = this.parent.hasCycle(this, typeRef);
                    if (cycleDetected) {
                        const tooltip = `Cycle detected<br/><br/>${cycleDetected}`;
                        this.ide.danger(tooltip, 4000);
                        this.html.find('.selectType').css('border', '2px solid red');
                        this.html.find('.selectType').attr('title', 'Cycle detected\n\n' + cycleDetected);
                    } else {
                        this.ide.repository.load(typeRef, (/** @type {TypeFile} */file) => {
                            const nestedLocalType = this.editor.registerLocalDefinition(file);
                            new SchemaRenderer(this, nestedLocalType, nestedLocalType.definition.schema, schemaContainer).render();
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
            SchemaPropertyDefinition.setSchemaPropertyCache(this.property, this.path);
            this.parent.addEmptyProperty();
        }
        if (oldPropertyValue != propertyValue) {
            this.localType.savePropertyChange(this);
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
