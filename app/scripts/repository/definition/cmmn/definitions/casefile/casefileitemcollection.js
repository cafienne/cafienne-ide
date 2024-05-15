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
     * Creates a new CaseFileItemDef child.
     * @returns {CaseFileItemDef}
     */
    createChildDefinition() {
        const newCaseFileItem = this.createDefinition(CaseFileItemDef);
        this.children.push(newCaseFileItem);
        newCaseFileItem.name = '';
        newCaseFileItem.multiplicity = 'ExactlyOne';
        newCaseFileItem.usedIn = '';
        newCaseFileItem.expanded = true;
        return newCaseFileItem;
    }

    /**
     * 
     * @param {CaseFileItemDef} child 
     * @param {CaseFileItemDef | undefined} after 
     */
    insert(child, after = undefined) {
        Util.insertInArray(this.children, child, after);
    }

    /**
     * Returns the case file item children of this element.
     * @returns {Array<CaseFileItemDef>}
     */
    get children() {
        return this._children;
    }
}
