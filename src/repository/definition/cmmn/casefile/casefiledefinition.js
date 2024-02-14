import CaseFileItemDef, { CaseFileItemCollection } from "./casefileitemdef";
import CaseFileItemTypeDefinition from "./casefileitemtypedefinition";

export default class CaseFileDefinition extends CaseFileItemCollection {
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
        this.parseElements('caseFileItem', CaseFileItemDef, this.children);
        this.isOldStyle = this.children.length > 0; // If we have found the <caseFileItem> tag, then it is an old style model.
        this.typeRef = this.parseAttribute('typeRef', '');
    }

    hasExternalReferences() {
        return !this.isOldStyle;
    }

    loadExternalReferences(callback) {
        this.resolveExternalDefinition(this.typeRef, definition => {
            if (definition) {
                this.type = /** @type {TypeDefinition} */ (definition);
                this.type.schema.properties.forEach(property => this.children.push(new CaseFileItemTypeDefinition(this.caseDefinition, this, property)));
            }
            callback();
        });
    }

    createExportNode(parentNode) {
        // Only export children if typeRef is empty
        const propertiesToExport = ['caseFileModel', 'typeRef', this.typeRef ? '' : 'children'];
        super.createExportNode(parentNode, ...propertiesToExport);
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
