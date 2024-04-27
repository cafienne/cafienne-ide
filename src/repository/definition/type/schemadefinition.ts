import ElementDefinition from "../elementdefinition";
import SchemaPropertyDefinition from "./schemapropertydefinition";
import TypeDefinition from "./typedefinition";

export default class SchemaDefinition extends ElementDefinition<TypeDefinition> {
    static TAG: string = 'schema';
    properties: SchemaPropertyDefinition[];
    constructor(importNode: Element, modelDefinition: TypeDefinition, parent: ElementDefinition<TypeDefinition>) {
        super(importNode, modelDefinition, parent);
        this.properties = this.parseElements('property', SchemaPropertyDefinition);       
    }

    createEmptyProperty(): SchemaPropertyDefinition {
        const property: SchemaPropertyDefinition = this.createDefinition(SchemaPropertyDefinition);
        property.name = '';
        property.type = '';
        property.isBusinessIdentifier = false;
        property.multiplicity = 'ExactlyOne';
        return property;
    }

    createExportNode(parentNode: Element, tagName: string = SchemaDefinition.TAG, ...propertyNames: any[]) {
        super.createExportNode(parentNode, tagName, 'properties', propertyNames);
    }

    toJSONSchema(parent: any): Object {
        const jsonSchema = {};
        parent['properties'] = jsonSchema;
        const required: [] = [];
        this.properties.forEach(property => {
            property.toJSONSchema(jsonSchema, required);
            if (required.length) {
                parent['required'] = required;
            }
        });
        return jsonSchema;
    }
}
