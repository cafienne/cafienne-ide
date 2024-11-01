import ConstraintDefinition from "../caseplan/constraintdefinition";

export default class IfPartDefinition extends ConstraintDefinition {
    createExportNode(parentNode: Element) {
        super.createExportNode(parentNode, 'ifPart');
    }
}
