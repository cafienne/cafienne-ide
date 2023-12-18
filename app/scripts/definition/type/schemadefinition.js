class SchemaDefinition extends XMLElementDefinition {
    /**
     * @param {Element} importNode 
     * @param {TypeDefinition} modelDefinition 
     * @param {XMLElementDefinition} parent 
     */
    constructor(importNode, modelDefinition, parent) {
        super(importNode, modelDefinition, parent);
        /** @type {Array<SchemaPropertyDefinition>} */
        this.properties = this.parseElements('property', SchemaPropertyDefinition);       
    }

    /**
     * Returns all references to other types recursively for embedded schemas.
     * @returns {Array.<string>}
     */
    getReferences() {
        const references = [];
        this.properties.forEach(property => {
            if (property.typeRef) {
                references.push(property.typeRef);
            }
            if (property.schema) {
                references.push(...property.schema.getReferences());
            }
        });
        return references;
    }

    createExportNode(parentNode, tagName = SchemaDefinition.TAG, ...propertyNames) {
        super.createExportNode(parentNode, tagName, 'properties', propertyNames);
    }
}

SchemaDefinition.TAG = 'schema';
