import ModelDefinition from "@repository/definition/modeldefinition";
import CaseDefinition from "../casedefinition";
import CriterionDefinition from "./criteriondefinition";
import OnPartDefinition from "./onpartdefinition";
import ElementDefinition from "@repository/definition/elementdefinition";

export default class CaseFileItemOnPartDefinition extends OnPartDefinition {
    constructor(importNode: Element, caseDefinition: CaseDefinition, parent: CriterionDefinition) {
        super(importNode, caseDefinition, parent);
    }

    updateReferences<X extends ModelDefinition>(element: ElementDefinition<X>, oldId: string, newId: string, oldName: string, newName: string) {
        if (this.sourceRef === oldId) {
            this.sourceRef = newId;
        }
    }

    createExportNode(parentNode: Element) {
        super.createExportNode(parentNode, 'caseFileItemOnPart');
    }
}
