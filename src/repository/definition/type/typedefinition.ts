import { Element } from "../../../util/xml";
import TypeFile from "../../serverfile/typefile";
import { getSimpleModelName } from "../../util/repositoryutil";
import ModelDefinition from "../modeldefinition";
import SchemaDefinition from "./schemadefinition";

export default class TypeDefinition extends ModelDefinition {
    private _schema?: SchemaDefinition;

    static createDefinitionSource(fullName: string) {
        return `<type id="${fullName + '.type'}" name="${getSimpleModelName(fullName)}"><schema/></type>`;
    }

    constructor(public file: TypeFile) {
        super(file);
        this._schema = this.parseElement(SchemaDefinition.TAG, SchemaDefinition);
    }

    get schema(): SchemaDefinition {
        if (!this._schema) {
            this._schema = this.createDefinition(SchemaDefinition);
        }
        return this._schema;
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
