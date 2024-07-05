import { MilestoneEventListenerDefinition } from "./planitem";

export default class MilestoneDefinition extends MilestoneEventListenerDefinition {
    static get infix() {
        return 'ms';
    }

    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
    }

    createExportNode(parentNode) {
        super.createExportNode(parentNode, 'milestone');
    }
}
