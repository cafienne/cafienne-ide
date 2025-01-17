import CaseDefinition from "../../../../cmmn/casedefinition";
import PlanItem from "../../planitem";
import TaskPairingDefinition from "./taskpairingdefinition";

export default class FourEyesDefinition extends TaskPairingDefinition {
    static TAG = 'four_eyes';

    constructor(importNode: Element, caseDefinition: CaseDefinition, public parent: PlanItem) {
        super(importNode, caseDefinition, parent);
    }

    counterPartOf(item: PlanItem): FourEyesDefinition {
        if (!item.fourEyes) {
            throw new Error("We should always have a counter part");
        }
        return item.fourEyes;
    }

    createExportNode(parentNode: Element) {
        super.createExportNode(parentNode, FourEyesDefinition.TAG);
    }
}
