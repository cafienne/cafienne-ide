class CaseFileItemCollection extends CMMNElementDefinition {
    /**
     * Helper class to share logic across CaseFile and CaseFileItem (mostly the 'children' array)
     */
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
        /** @type {Array<CaseFileItemDef>} */
        this._children = [];
    }

    /**
     * Creates a new CaseFileItemDef or its subtype CaseFileItemRefDef child.
     * @param {typeof CaseFileItemDef|typeof CaseFileItemRefDef} caseFileItemChildType Type of the child can be CaseFileItemDef or its subtype CaseFileItemRefDef
     * @returns {CaseFileItemDef}
     */
    createChildDefinition(caseFileItemChildType = CaseFileItemDef) {
        const newCaseFileItem = this.createDefinition(caseFileItemChildType);
        this.children.push(newCaseFileItem);
        newCaseFileItem.name = '';
        newCaseFileItem.multiplicity = 'ExactlyOne';
        newCaseFileItem.usedIn = '';
        newCaseFileItem.expanded = true;
        return newCaseFileItem;
    }
    
    /**
     * @returns {CaseFileItemCollection}
     */
    get parentCollection() {
        if (this.parent instanceof CaseFileItemCollection) {
            return this.parent;
        } else {
            return undefined;
        }
    }

    /**
     * Returns the case file item children of this element.
     * @returns {Array<CaseFileItemDef>}
     */
    get children() {
        return this._children;
    }
}
