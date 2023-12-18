class TypeDefinition extends ModelDefinition {
    /**
     * @param {TypeFile} file
     * @param {Element} importNode 
     */
    constructor(file, importNode = file.content.xml) {
        super(file, importNode);
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
