class TypeDefinition extends ModelDefinition {
    /**
     * @param {Element} importNode 
     * @param {ModelDefinition} modelDefinition 
     * @param {XMLElementDefinition} parent 
     */
    constructor(importNode, modelDefinition = undefined, parent = undefined) {
        super(importNode);
        // Because TypeDefintion can be a nested type in other <type> we need to set the modelDefinition
        if (modelDefinition) {
            this.modelDefinition = modelDefinition;
        }
        // Because TypeDefintion can be a nested type in other <type> we need to set the parent
        if (parent) {
            this.parent = parent;
        }
        /** @type {Array<TypeDefinition>} */
        this.types = [];
    }

    parseDocument() {
        super.parseDocument();
        this.multiplicity = this.parseAttribute('multiplicity', 'Unspecified');
        this.type = this.parseAttribute('type', '');
        this.types = this.parseElements('type', TypeDefinition);
        this.isBusinessIdentifier = this.parseBooleanAttribute('isBusinessIdentifier', false);
        this.parseChildTypes(this.types);
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

    /**
     * Returns all descending type file items including this one, recursively.
     */
    getDescendants() {
        const descendants = [this];
        this.types.forEach(child => child.getDescendants().forEach(c => descendants.push(c)));
        return descendants;
    }
        
    parseChildTypes(types) {
        types.forEach(type => type.parseDocument());
    }

    createExportNode(parentNode, tagName = 'type', ...propertyNames) {
        super.createExportNode(parentNode, tagName, propertyNames);
        if (this.types.length > 0) {
            this.types.forEach(child => child.createExportNode(this.exportNode, 'type', 'type', 'multiplicity', 'isBusinessIdentifier'));
        }
    }

    toXML() {
        const xmlDocument = super.exportModel('type', 'id', 'name', 'type', 'multiplicity', 'isBusinessIdentifier');
        if (this.types.length > 0) {
            this.types.forEach(child => child.createExportNode(this.exportNode, 'type', 'type', 'multiplicity', 'isBusinessIdentifier'));
        }
        return xmlDocument;
    }
}
