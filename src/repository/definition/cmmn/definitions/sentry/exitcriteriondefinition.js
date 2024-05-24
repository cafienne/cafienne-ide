import CriterionDefinition from "./criteriondefinition";

export default class ExitCriterionDefinition extends CriterionDefinition {
    /**
     * @param {Element} parentNode 
     */
    createExportNode(parentNode) {
        super.createExportNode(parentNode, 'exitCriterion');
    }
}
