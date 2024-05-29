import TypeFile from "@repository/serverfile/typefile";
import SchemaDefinition from "./schemadefinition";
import ModelDefinition from "../modeldefinition";

export default class TypeDefinition extends ModelDefinition {
    static createDefinitionSource(name) {
        const fileName = name + '.type';
        return `<type id="${fileName}" name="${name}"><schema/></type>`;
    }

    /**
     * @param {TypeFile} file
     */
    constructor(file) {
        super(file);
        this.file = file;
    }

    parseDocument() {
        super.parseDocument();
        /** @type {SchemaDefinition} */
        this.schema = this.parseElement(SchemaDefinition.TAG, SchemaDefinition);
    }

    createExportNode(parentNode, tagName = 'type', ...propertyNames) {
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
                $id: this.id,
                title: this.name,
                type: 'object'
            }
        }
        this.schema.toJSONSchema(jsonSchema.schema)
        return jsonSchema;
    }
}
