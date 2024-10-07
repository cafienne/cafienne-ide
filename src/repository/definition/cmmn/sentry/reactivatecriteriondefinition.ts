import CriterionDefinition from "./criteriondefinition";

export default class ReactivateCriterionDefinition extends CriterionDefinition {
    static TAG = 'reactivateCriterion';

    createExportNode(parentNode: Element) {
        super.createExtensionNode(parentNode, ReactivateCriterionDefinition.TAG, 'id', 'name', 'documentation', 'ifPart', 'caseFileItemOnParts', 'planItemOnParts');
    }
}
