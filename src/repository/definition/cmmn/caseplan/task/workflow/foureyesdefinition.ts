import CaseDefinition from "@repository/definition/cmmn/casedefinition";
import PlanItem from "../../planitem";
import RendezVousDefinition from "./rendezvousdefinition";
import TaskPairingDefinition from "./taskpairingdefinition";

export default class FourEyesDefinition extends TaskPairingDefinition {
    static TAG = 'four_eyes';

    constructor(importNode: Element, caseDefinition: CaseDefinition, public parent: PlanItem) {
        super(importNode, caseDefinition, parent);
    }

    counterPartOf(item: PlanItem): RendezVousDefinition {
        return item.fourEyes;
    }

    createExportNode(parentNode: Element) {
        super.createExportNode(parentNode, FourEyesDefinition.TAG);
    }
}
