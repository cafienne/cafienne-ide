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
     * 
     * @returns {SchemaPropertyDefinition}
     */
    createEmptyProperty() {
        const property = this.createDefinition(SchemaPropertyDefinition);
        property.name = '';
        property.type = '';
        property.isBusinessIdentifier = false;
        property.multiplicity = 'ExactlyOne';
        return property;
    }

    /**
     * 
     * @returns {SchemaPropertyDefinition}
     */
    createChildProperty(name, type = '', multiplicity = 'ExactlyOne', isBusinessIdentifier = false) {
        const property = this.createEmptyProperty();
        property.name = name;
        property.type = type;
        property.multiplicity = multiplicity;
        property.isBusinessIdentifier = isBusinessIdentifier;
        this.properties.push(property);
        return property;
    }

    createExportNode(parentNode, tagName = SchemaDefinition.TAG, ...propertyNames) {
        super.createExportNode(parentNode, tagName, 'properties', propertyNames);
    }

    toJSONSchema(parent) {
        const jsonSchema = {};
        parent['properties'] = jsonSchema;
        const required = [];
        this.properties.forEach(property => {
            property.toJSONSchema(jsonSchema, required);
            if (required.length) {
                parent['required'] = required;
            }
        });
        return jsonSchema;
    }
}

SchemaDefinition.TAG = 'schema';
