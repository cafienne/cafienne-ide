class SchemaPropertyDefinition extends ReferableElementDefinition {
    constructor(importNode, modelDefinition, parent) {
        super(importNode, modelDefinition, parent);
        this.name = this.parseAttribute('name', '');
        this._type = this.parseAttribute('type', '');
        this.multiplicity = this.parseAttribute('multiplicity', 'Unspecified');
        this.isBusinessIdentifier = this.parseBooleanAttribute('isBusinessIdentifier', false);
        if (this._type === 'object') {
            /** @type {SchemaDefinition} */
            this.schema = this.parseElement(SchemaDefinition.TAG, SchemaDefinition);
        }
        SchemaPropertyDefinition.setSchemaPropertyCache(this);
    }

    /** @returns {string} */
    get type() {
        return this._type;
    }

    static get prefix() {
        return 'sp';
    }

    static schemaPropertyCache = new Map();
 
    /**
     * 
     * @param {string} id 
     * @returns {SchemaPropertyDefinition}
     */
    static getSchemaPropertyFromCache(id) {
        return SchemaPropertyDefinition.schemaPropertyCache.get(id);
    }

    /**
     * 
     * @param {SchemaPropertyDefinition} property 
     */
    static setSchemaPropertyCache(property) {
        if (property && property.id) {
            this.schemaPropertyCache.set(property.id, property);
        }
    }

    /** @param {string} newType */
    set type(newType) {
        if (this._type !== newType) {
            this._type = newType;
            if (newType === 'object') {
                // An embedded complex type will have a schema
                this.schema = this.createDefinition(SchemaDefinition);
            } else {
                // A primitive type and a typeRef will not have a schema
                this.schema = undefined;
            }
        }
    }

    /** @returns {string} */
    get typeRef() {
        return this.type.endsWith('.type') ? this.type : '';
    }

    /** @returns {boolean} */
    get isPrimitiveType() {
        return !this.typeRef && this.type !== 'object';
    }

    /** @returns {boolean} */
    get isComplexType() {
        return !this.isPrimitiveType;
    }

    createExportNode(parent) {
        super.createExportNode(parent, 'property', 'type', SchemaDefinition.TAG, 'multiplicity');
        if (this.isBusinessIdentifier) {
            this.exportNode.setAttribute('isBusinessIdentifier', 'true');
        }
    }

    toJSONSchema(properties, required) {
        const jsonProperty = {};
        properties[this.name] = jsonProperty;
        jsonProperty.$id = this.id;
        jsonProperty.title = this.name; // Default label is the name of the property
        /** @type {object} */
        let property =  jsonProperty;
        if (this.type === 'object') {
            property.type = 'object';
            this.schema.toJSONSchema(property)
        } else if (this.typeRef) {
            property.$ref = this.typeRef;
        } else {
            property.type = this.type;
        }
        switch (this.multiplicity) {
        case 'ExactlyOne':
            // Required property
            required.push(this.name);
            break;
        case 'ZeroOrOne':
            // Optional property
            jsonProperty.minItems = 0;
            jsonProperty.maxItems = 1;
            break;
        case 'ZeroOrMore':
            // Array with optional items
            // Array items will have the type of the property
            this.setJSONArrayItemType(jsonProperty, 0);
            break;
        case 'OneOrMore':
            // Array with at least on required item
            required.push(this.name);
            // Array items will have the type of the property
            this.setJSONArrayItemType(jsonProperty, 1);
            break;
        case 'Unspecified':
            // Array with unspecified number of items
            // Array items will have the type of the property
            this.setJSONArrayItemType(jsonProperty);
            break;
        case 'Unknown':
            break;
        }
        return jsonProperty;
    }

    setJSONArrayItemType(property, minItems=undefined, maxItems=undefined) {
        if (minItems) {
            property.minItems = minItems;
        }
        if (maxItems) {
            property.maxItems = maxItems;
        }
        const items = {};
        if (property.type == "object") {
            items.properties = property.properties;
            items.required = property.required;
            delete property.properties;
            delete property.required;
        }
        if (this.typeRef) {
            items.$ref = property.$ref;
            delete property.$ref;
        } else {
            items.type = property.type;
            delete property.type;
        }
        property.type = "array";
        property.items = items;
        return property.items;
    }
}
