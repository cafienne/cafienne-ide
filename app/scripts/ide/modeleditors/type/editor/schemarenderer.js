
class SchemaRenderer extends TypeRenderer {
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
