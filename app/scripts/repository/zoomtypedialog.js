class ZoomTypeDialog extends Dialog {
    /**
     * @param {IDE} ide
     * @param {string} typeRef
     */
    constructor(ide, typeRef) {
        super(ide, 'Select an item');
        this.typeRef = typeRef;
    }

    renderDialog() {
        const htmlDialog = $(`
            <form class="zoomtypedialog">
                <div class="typeschemacontainer">
                </div>
                <br/>
                <input type="submit" class='buttonOk' value="OK"/>
                <button class='buttonCancel'>Cancel</button>
            </form>
        `);
        this.dialogHTML.append(htmlDialog);
        this.ide.repository.load(this.typeRef, file => {
            this.renderSchema(file.definition.schema, file, this.dialogHTML.find('.typeschemacontainer'), '');
        });
        this.dialogHTML.find('.buttonOk').on('click', e => this.ok());
        this.dialogHTML.find('.buttonCancel').on('click', e => this.cancel());
    }

    /**
     * 
     * @param {SchemaDefinition} schema
     * @param {TypeFile} file 
     * @param {JQuery<HTMLElement>} container 
     * @param {string} path 
     */
    renderSchema(schema, file, container, path) {
        if (schema) {
            schema.properties.forEach(type => this.renderProperty(type, file, container, path));
        }
    }

    ok() {
        super.closeModalDialog(this.selectedProperty ? {
            property: this.selectedProperty.property,
            name: this.selectedProperty.property.name,
            id: this.selectedProperty.property.id,
            path: this.selectedProperty.path
        } : false);
    }
    
    cancel() {
        super.closeModalDialog(false);
    }

    /**
     * 
     * @param {SchemaPropertyDefinition} property
     * @param {TypeFile} file 
     * @param {JQuery<HTMLElement>} container
     * @param {string} path 
     */
    renderProperty(property, file, container, path) {
        if (property.isComplexType) {
            const html = $(`<div class='propertycontainer'>
                <div class='schema-property-item'><img class="schemaPropertyIcon" style="width:14px;margin:2px" src="/images/svg/casefileitem.svg"/>${property.name}</div>
                <div style="padding-left: 16px" class="propertyschemacontainer schemacontainer">
                </div>
            </div>`);
            path = (path ? path + '/' : '') + property.name;
            container.append(html);
            html.find('.schema-property-item').on('click', e => {
                this.dialogHTML.find('.propertyselected').removeClass('propertyselected');
                this.selectedProperty = {property:property, path:path};
                $(e.target).addClass('propertyselected');
            });
            html.find('.schema-property-item').on('dblclick', e => {
                this.ok();
            });
            const schemaContainer = html.find('>.schemacontainer');
            if (property.type === 'object' && property.schema) {
                this.renderSchema(property.schema, file, schemaContainer, path);
            } else {
                const typeRef = property.typeRef;
                this.ide.repository.load(typeRef, file => {
                    this.renderSchema(file.definition.schema, file, schemaContainer, path);
                });
            }
        }
    }
}
