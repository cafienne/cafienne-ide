import CaseDefinition from "@repository/definition/cmmn/casedefinition";
import PlanItem from "../../planitem";
import TaskPairingDefinition from "./taskpairingdefinition";

export default class RendezVousDefinition extends TaskPairingDefinition {
    static TAG = 'rendez_vous';

    constructor(importNode: Element, caseDefinition: CaseDefinition, public parent: PlanItem) {
        super(importNode, caseDefinition, parent);
    }

    counterPartOf(item: PlanItem): TaskPairingDefinition {
        if (!item.rendezVous) {
            throw new Error("We should always have a counter part");
        }
        return item.rendezVous;
    }

    createExportNode(parentNode: Element) {
        if (this.present) {
            super.createExportNode(parentNode, RendezVousDefinition.TAG);
        }
    }

    add(item: PlanItem) {
        super.add(item);
        const rendezVousOfItem = this.counterPartOf(item);
        // Also adopt all existing rendezVous colleagues of the item
        rendezVousOfItem.references.filter(reference => reference.task !== this.parent).forEach(reference => super.add(reference.task));
        // And also make our existing colleagues rendezVous with the item
        this.references.filter(reference => reference.task !== item).forEach(reference => {
            const colleague = reference.task;
            rendezVousOfItem.adoptReference(colleague);
            this.counterPartOf(colleague).adoptReference(item);
        });
    }

    remove(item: PlanItem) {
        super.remove(item);
        const rendezVousOfItem = this.counterPartOf(item);
        // Also remove our colleagues from the item's rendezVous
        this.references.filter(reference => reference.task !== item).forEach(reference => {
            const colleague = reference.task;
            rendezVousOfItem.removeReference(colleague);
            this.counterPartOf(colleague).removeReference(item);
        });
    }
}
