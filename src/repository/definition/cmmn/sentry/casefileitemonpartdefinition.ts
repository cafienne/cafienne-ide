import CaseDefinition from "../casedefinition";
import CriterionDefinition from "./criteriondefinition";
import OnPartDefinition from "./onpartdefinition";

export default class CaseFileItemOnPartDefinition extends OnPartDefinition {
    constructor(importNode: Element, caseDefinition: CaseDefinition, parent: CriterionDefinition) {
        super(importNode, caseDefinition, parent);
    }

    createExportNode(parentNode: Element) {
        super.createExportNode(parentNode, 'caseFileItemOnPart');
    }
}
