class CaseFileDefinition extends CaseFileItemCollection {
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
        this.parseElements('caseFileItem', CaseFileItemDef, this.children);
        this.typeRef = this.parseAttribute('typeRef', '');
    }

    createExportNode(parentNode) {
        super.createExportNode(parentNode, 'caseFileModel', 'children', 'typeRef');
    }

    /**
     * Returns all case file items in the case file, recursively.
     * @returns {Array<CaseFileItemDef>}
     */
    getDescendants() {
        const descendants = [];
        this.children.forEach(child => child.getDescendants().forEach(c => descendants.push(c)));
        return descendants;
    }
}
