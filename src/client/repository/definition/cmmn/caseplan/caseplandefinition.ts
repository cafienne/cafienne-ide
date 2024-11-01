import StageDefinition from "./stagedefinition";

export default class CasePlanDefinition extends StageDefinition {
    get planItemDefinitions() {
        return this.planItems;
    }

    static get prefix() {
        return 'cm';
    }

    createExportNode(parentNode: Element) {
        super.createExportNode(parentNode, 'casePlanModel');
    }

    get transitions() {
        return ['close', 'complete', 'create', 'reactivate', 'suspend', 'terminate'];
    }
}
