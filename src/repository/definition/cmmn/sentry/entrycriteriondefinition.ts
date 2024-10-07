import CriterionDefinition from "./criteriondefinition";

export default class EntryCriterionDefinition extends CriterionDefinition {
    createExportNode(parentNode: Element) {
        super.createExportNode(parentNode, 'entryCriterion');
    }
}
