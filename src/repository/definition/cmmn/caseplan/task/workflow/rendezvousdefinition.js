import PlanItem from "../../planitem";
import TaskPairingDefinition from "./taskpairingdefinition";

export default class RendezVousDefinition extends TaskPairingDefinition {
    /**
     * 
     * @param {*} importNode 
     * @param {*} caseDefinition 
     * @param {PlanItem} parent 
     */
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
    }

    /**
     * @param {PlanItem} item 
     * @returns {TaskPairingDefinition}
     */
    counterPartOf(item) {
        return item.rendezVous;
    }

    createExportNode(parentNode) {
        if (this.present) {
            super.createExportNode(parentNode, RendezVousDefinition.TAG);
        }
    }

    add(item) {
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

    remove(item) {
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

RendezVousDefinition.TAG = 'rendez_vous';
