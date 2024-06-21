import CriterionDefinition from "./criteriondefinition";

export default class EntryCriterionDefinition extends CriterionDefinition {
    /**
     * @param {Element} parentNode 
     */
    createExportNode(parentNode) {
        super.createExportNode(parentNode, 'entryCriterion');
    }
}
