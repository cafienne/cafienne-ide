import TypeFile from "@repository/serverfile/typefile";
import SchemaDefinition from "./schemadefinition";
import ModelDefinition from "../modeldefinition";

export default class TypeDefinition extends ModelDefinition {
    schema?: SchemaDefinition;

    constructor(public file: TypeFile) {
        super(file);
        this.schema = this.parseElement(SchemaDefinition.TAG, SchemaDefinition);
    }

    createExportNode(parentNode: Element, tagName = 'type', ...propertyNames: any[]) {
        super.createExportNode(parentNode, tagName, propertyNames);
    }

    toXML() {
        const xmlDocument = super.exportModel('type', 'schema');
        return xmlDocument;
    }

    toJSONSchema() {
        // Example JSON
        const jsonSchema = {
            schema: {
                $id: this.id.slice(0, this.id.length - 5), // Strip ".type" from id
                title: this.name,
                type: 'object'
            }
        }
        this.schema?.toJSONSchema(jsonSchema.schema, jsonSchema.schema)
        return jsonSchema;
    }
}
