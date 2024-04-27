class SchemaPropertyDefinition extends ReferableElementDefinition {
    constructor(importNode, modelDefinition, parent) {
        super(importNode, modelDefinition, parent);
        this.name = this.parseAttribute('name', '');
        this._type = this.parseAttribute('type', '');
        this.format = this.parseAttribute('format', '');
        this.multiplicity = this.parseAttribute('multiplicity', 'Unspecified');
        this.isBusinessIdentifier = this.parseBooleanAttribute('isBusinessIdentifier', false);
        this.isNew = importNode === undefined;
        if (this._type === 'object') {
            /** @type {SchemaDefinition} */
            this.schema = this.parseElement(SchemaDefinition.TAG, SchemaDefinition);
        }
    }

    hasExternalReferences() {
        return this.typeRef !== '';
    }

    loadExternalReferences(callback) {
        this.resolveExternalDefinition(this.typeRef, definition => {
            if (definition) {
                console.log("Received " + this.typeRef + ": " + definition.constructor.name);
            }
            this.subType = /** @type {TypeDefinition} */(definition);
            callback();
        });
    }

    /** @returns {string} */
    get type() {
        return this._type;
    }

    static get prefix() {
        return 'sp';
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
        // console.log("createExportNode " + " type: " + this.type + " format: " + this.format + this.cmmnType + this.cmmnType );
        if (this.format) {
            this.exportNode.setAttribute('format', this.format);
        }
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
        const property = jsonProperty;
        if (this.type === 'object') {
            property.type = 'object';
            this.schema.toJSONSchema(property)
        } else if (this.typeRef) {
            property.$ref = this.typeRef;
        } else {
            property.type = this.type;
            if (this.format) {
                property.format = this.format; 
            }
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

    setJSONArrayItemType(property, minItems = undefined, maxItems = undefined) {
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
        property.type = 'array';
        property.items = items;
        return property.items;
    }
    
    // This is the visual type in the TypeSelector
    get cmmnType() {
        switch (this.format) {
        // Types not yet implemented in IDE
        // case 'gYear':
        // case 'gYearMonth':
        // case 'gMonthDay':
        // case 'gDay':
        // case 'hexBinary':
        // case 'base64Binary':
        case 'uri':
        case 'time':
        case 'date':
        case 'date-time':
        case 'duration':
        case 'QName':
            return this.format;
            break;
        default:
            return this.type;
        }
    }

    // This is the visual type in the TypeSelector. That will be stored as (JSON-Schema compatible) type and format attributes 
    set cmmnType(value) {
        switch (value) {
        // Types not yet implemented in IDE
        // case 'gYear':
        // case 'gYearMonth':
        // case 'gMonthDay':
        // case 'gDay':
        // case 'hexBinary':
        // case 'base64Binary':
        case 'uri':
        case 'time':
        case 'date':
        case 'date-time':
        case 'duration':
        case 'QName':
            this.type = 'string';
            this.format = value;
            break;
        default:
            this.type = value;
            this.format = '';
        }
    }
}
