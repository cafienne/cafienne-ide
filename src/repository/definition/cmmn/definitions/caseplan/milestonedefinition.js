import { MilestoneEventListenerDefinition } from "./planitemdefinitiondefinition";

export default class MilestoneDefinition extends MilestoneEventListenerDefinition {
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
    }

    static get prefix() {
        return 'ms';
    }

    createExportNode(parentNode) {
        super.createExportNode(parentNode, 'milestone');
    }
}
