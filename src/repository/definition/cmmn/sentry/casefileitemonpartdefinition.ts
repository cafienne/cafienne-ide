import Util from "../../../../util/util";
import { Element } from "../../../../util/xml";
import ElementDefinition from "../../elementdefinition";
import ModelDefinition from "../../modeldefinition";
import CaseDefinition from "../casedefinition";
import CaseFileItemDef from "../casefile/casefileitemdef";
import CaseFileItemTransition from "../casefile/casefileitemtransition";
import CriterionDefinition from "./criteriondefinition";
import OnPartDefinition from "./onpartdefinition";
import StandardEvent from "./standardevent";

export default class CaseFileItemOnPartDefinition extends OnPartDefinition<CaseFileItemDef> {
    constructor(importNode: Element, caseDefinition: CaseDefinition, public parent: CriterionDefinition) {
        super(importNode, caseDefinition, parent);
    }
    
    parseStandardEvent(value: string): StandardEvent {
        return CaseFileItemTransition.parse(value);
    }

    updateReferences<X extends ModelDefinition>(element: ElementDefinition<X>, oldId: string, newId: string, oldName: string, newName: string) {
        if (this.sourceRef.references(oldId)) {
            this.sourceRef.update(newId);
        }
    }

    get description() {
        return `${Util.ordinal_suffix_of(this.parent.caseFileItemOnParts.indexOf(this) + 1)} CaseFileItemOnPart`;
    }

    createExportNode(parentNode: Element) {
        super.createExportNode(parentNode, 'caseFileItemOnPart');
    }
}
