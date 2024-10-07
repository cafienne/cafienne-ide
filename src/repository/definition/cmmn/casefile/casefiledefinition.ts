import CMMNElementDefinition from "@repository/definition/cmmnelementdefinition";
import CaseDefinition from "../casedefinition";
import CaseFileItemDef, { CaseFileItemCollection } from "./casefileitemdef";

export default class CaseFileDefinition extends CaseFileItemCollection {
    constructor(importNode: Element, caseDefinition: CaseDefinition, parent: CMMNElementDefinition) {
        super(importNode, caseDefinition, parent);
        this.parseElements('caseFileItem', CaseFileItemDef, this.children);
    }

    createExportNode(parentNode: Element) {
        super.createExportNode(parentNode, 'caseFileModel', 'children');
    }

    /**
     * Returns all case file items in the case file, recursively.
     */
    getDescendants(): CaseFileItemDef[] {
        const descendants: CaseFileItemDef[] = [];
        this.children.forEach(child => child.getDescendants().forEach(c => descendants.push(c)));
        return descendants;
    }
}
