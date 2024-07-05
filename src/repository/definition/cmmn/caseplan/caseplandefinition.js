import StageDefinition from "./stagedefinition";

export default class CasePlanDefinition extends StageDefinition {
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
    }

    get planItemDefinitions() {
        return this.planItems;
    }

    static get prefix() {
        return 'cm';
    }

    createExportNode(parentNode) {
        super.createExportNode(parentNode, 'casePlanModel');
    }

    get transitions() {
        return ['close', 'complete', 'create', 'reactivate', 'suspend', 'terminate'];
    }
}
