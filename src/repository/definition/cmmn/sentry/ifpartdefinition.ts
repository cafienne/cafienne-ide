import { Element } from "../../../../util/xml";
import Validator from "../../../validate/validator";
import ConstraintDefinition from "../caseplan/constraintdefinition";

export default class IfPartDefinition extends ConstraintDefinition {
    createExportNode(parentNode: Element) {
        super.createExportNode(parentNode, 'ifPart');
    }

    validate(validator: Validator): void {
        // Check that we're not empty if defined...
    }
}
