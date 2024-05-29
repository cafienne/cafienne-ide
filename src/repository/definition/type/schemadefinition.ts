import Util from "@util/util";
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

    createChildProperty(name: string = '', type = '', multiplicity = 'ExactlyOne', isBusinessIdentifier = false): SchemaPropertyDefinition {
        const property: SchemaPropertyDefinition = this.createDefinition(SchemaPropertyDefinition);
        property.name = name;
        property.type = type;
        property.multiplicity = multiplicity;
        property.isBusinessIdentifier = isBusinessIdentifier;
        this.properties.push(property);
        return property;
    }

    createExportNode(parentNode: Element, tagName: string = SchemaDefinition.TAG, ...propertyNames: any[]) {
        super.createExportNode(parentNode, tagName, 'properties', propertyNames);
    }

    insert(child: SchemaPropertyDefinition, after?: SchemaPropertyDefinition) {
        Util.insertInArray(this.properties, child, after);
    }

    toJSONSchema(parent: any, root: any): Object {
        const jsonSchema = {};
        parent['properties'] = jsonSchema;
        const required: [] = [];
        this.properties.forEach(property => {
            property.toJSONSchema(jsonSchema, required, root);
            if (required.length) {
                parent['required'] = required;
            }
        });
        return jsonSchema;
    }
}
