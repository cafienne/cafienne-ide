import CriterionDefinition from "./criteriondefinition";

export default class ExitCriterionDefinition extends CriterionDefinition {
    createExportNode(parentNode: Element) {
        super.createExportNode(parentNode, 'exitCriterion');
    }
}
