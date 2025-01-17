import ElementDefinition from "../../elementdefinition";
import ModelDefinition from "../../modeldefinition";
import CaseDefinition from "../casedefinition";
import CaseFileItemDef from "../casefile/casefileitemdef";
import CriterionDefinition from "./criteriondefinition";
import OnPartDefinition from "./onpartdefinition";

export default class CaseFileItemOnPartDefinition extends OnPartDefinition<CaseFileItemDef> {
    constructor(importNode: Element, caseDefinition: CaseDefinition, parent: CriterionDefinition) {
        super(importNode, caseDefinition, parent);
    }

    updateReferences<X extends ModelDefinition>(element: ElementDefinition<X>, oldId: string, newId: string, oldName: string, newName: string) {
        if (this.sourceRef.references(oldId)) {
            this.sourceRef.update(newId);
        }
    }

    createExportNode(parentNode: Element) {
        super.createExportNode(parentNode, 'caseFileItemOnPart');
    }
}
