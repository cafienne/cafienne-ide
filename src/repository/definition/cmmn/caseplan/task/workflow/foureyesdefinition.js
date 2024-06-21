import PlanItem from "../../planitem";
import TaskPairingDefinition from "./taskpairingdefinition";

export default class FourEyesDefinition extends TaskPairingDefinition {
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
        return item.fourEyes;
    }

    createExportNode(parentNode) {
        super.createExportNode(parentNode, FourEyesDefinition.TAG);
    }
}

FourEyesDefinition.TAG = 'four_eyes';
