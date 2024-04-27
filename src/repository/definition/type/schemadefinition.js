import ElementDefinition from "../elementdefinition";
import SchemaPropertyDefinition from "./schemapropertydefinition";
import TypeDefinition from "./typedefinition";

export default class SchemaDefinition extends ElementDefinition {
    /**
     * @param {Element} importNode 
     * @param {TypeDefinition} modelDefinition 
     * @param {ElementDefinition} parent 
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
