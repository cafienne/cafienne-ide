import Util from "@util/util";
import ElementDefinition from "../elementdefinition";
import SchemaPropertyDefinition from "./schemapropertydefinition";
import TypeDefinition from "./typedefinition";
import ModelDefinition from "../modeldefinition";

export default class SchemaDefinition extends ElementDefinition<TypeDefinition> {
    static TAG: string = 'schema';
    properties: SchemaPropertyDefinition[];
    constructor(importNode: Element, public modelDefinition: TypeDefinition, public parent: ElementDefinition<TypeDefinition>) {
        super(importNode, modelDefinition, parent);
        this.properties = this.parseElements('property', SchemaPropertyDefinition);
    }

    createChildProperty(name: string = '', type = '', multiplicity = 'ExactlyOne', isBusinessIdentifier = false): SchemaPropertyDefinition {
        const property: SchemaPropertyDefinition = this.createDefinition(SchemaPropertyDefinition);
        property.name = name;
        property._type = type; // Only assign the _type, not the type, as that will invoke loading the dependencies
        property.multiplicity = multiplicity;
        property.isBusinessIdentifier = isBusinessIdentifier;
        this.properties.push(property);
        return property;
    }

    searchInboundReferences(): ElementDefinition<ModelDefinition>[] {
        // SchemaDefinition is a place holder for child properties (both in TypeDefinition and in SchemaPropertyDefinitions of complex type)
        // References are always to the TypeDefinition or to the SchemaPropertyDefinition, and therefore we're returning the references to our parent only.
        //  Note that the only one refering to this definition is _always_ the parent.
        return this.parent.searchInboundReferences();
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
        // Only generate properties that have a name
        this.properties.filter(property => property.name.length > 0).forEach(property => {
            property.toJSONSchema(jsonSchema, required, root);
            if (required.length) {
                parent['required'] = required;
            }
        });
        return jsonSchema;
    }
}
