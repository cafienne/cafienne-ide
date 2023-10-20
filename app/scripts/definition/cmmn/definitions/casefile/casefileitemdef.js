class CaseFileItemDef extends CaseFileItemCollection {
    /**
     * @returns {Array<String>} List of the possible events/transitions on a case file item
     */
    static get transitions() {
        return ['', 'addChild', 'addReference', 'create', 'delete', 'removeChild', 'removeReference', 'replace', 'update'];
    }

    /**
     * 
     * @param {CaseDefinition} parent 
     * @param {String} id
     */
    static createEmptyDefinition(parent, id = undefined) {
        const definition = parent.createDefinition(CaseFileItemDef, id, '');
        definition.isEmpty = true;        
        return definition;
    }

    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
        this.multiplicity = this.parseAttribute('multiplicity', 'Unspecified');
        this.definitionRef = this.parseAttribute('definitionRef');
        this.parseGrandChildren('caseFileItem', CaseFileItemDef, this.children);
        this.isEmpty = false;
    }

    get isArray() {
        return this.multiplicity.endsWith('OrMore');
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

    get definitionRef() {
        return this._definitionRef;
    }

    set definitionRef(value) {
        this._definitionRef = value;
    }

    parseGrandChildren(childName, constructor, collection) {
        const child = XML.getChildByTagName(this.importNode, 'children');
        if (child) {
            XML.getChildrenByTagName(child, childName).forEach(childNode => this.instantiateChild(childNode, constructor, collection));
        }
        return collection;
    }

    createExportNode(parentNode, tagName = 'caseFileItem', ...propertyNames) {
        if (this.isEmpty) return;
        if (tagName === 'children') {
            //On top level <caseFileModel> children should be exported as <caseFileItem> and not as <children>
            tagName = 'caseFileItem';
        }
        super.createExportNode(parentNode, tagName, 'multiplicity', 'definitionRef', propertyNames);
        this.exportChildren();
    }

    exportChildren() {
        if (this.children.length > 0) {
            const childrenNode = XML.createChildElement(this.exportNode, 'children');
            this.children.forEach(child => child.createExportNode(childrenNode));
        }
    }
}
