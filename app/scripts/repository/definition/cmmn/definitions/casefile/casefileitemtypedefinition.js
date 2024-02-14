class CaseFileItemTypeDefinition extends CaseFileItemDef {
    /**
     * 
     * @param {CaseDefinition} caseDefinition 
     * @param {*} parent 
     * @param {SchemaPropertyDefinition} propertyDefinition 
     */
    constructor(caseDefinition, parent, propertyDefinition) {
        super(undefined, caseDefinition, parent);
        this.property = propertyDefinition;
        this.name = propertyDefinition.name;
        this.id = this.getPath();
        this.multiplicity = propertyDefinition.multiplicity;

        const childProperties = this.property.schema ? this.property.schema.properties : this.property.subType ? this.property.subType.schema.properties : [];
        childProperties.filter(p => p.isComplexType).forEach(child => this.children.push(new CaseFileItemTypeDefinition(this.caseDefinition, this, child)));

        this.isEmpty = false;
    }

    referencesElement(element) {
        return element === this.property;
    }

    getPath() {
        const parentPaths = [];
        let ancestor = this.parent;
        while (ancestor && ancestor instanceof CaseFileItemTypeDefinition) {
            parentPaths.push(ancestor.property.name);
            ancestor = ancestor.parent;
        }
        const parent = parentPaths.filter(p => p !== '').reverse().join('/');
        return parent.length > 0 ? parent + '/' + this.property.name : this.property.name;
    }

    /**
     * Returns the default transition for this type of plan item.
     * @returns {String}
     */
    get defaultTransition() {
        return 'create';
    }

    /**
     * Returns all descending case file items including this one, recursively.
     */
    getDescendants() {
        const descendants = [this];
        this.children.forEach(child => child.getDescendants().forEach(c => descendants.push(c)));
        return descendants;
    }

    createExportNode() {
        return;
    }
}
