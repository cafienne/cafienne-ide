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
        if (this.isBusinessIdentifier) {
            this.exportNode.setAttribute('isBusinessIdentifier', 'true');
        }
    }
}
