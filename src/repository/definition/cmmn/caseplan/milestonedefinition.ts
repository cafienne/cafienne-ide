import { Element } from "../../../../util/xml";
import Validator from "../../../validate/validator";
import MilestoneEventListenerDefinition from "./milestoneeventlistenerdefinition";

export default class MilestoneDefinition extends MilestoneEventListenerDefinition {
    protected infix() {
        return 'ms';
    }

    validate(validator: Validator): void {
        super.validate(validator);
        if (this.itemControl.repetitionRule) {
            if (this.entryCriteria.length == 0) {
                validator.raiseError(this, `${this} has a repetition rule defined, but no entry criteria. Entry criteria are mandatory for repeating milestones.`);
            }
        }
    }

    createExportNode(parentNode: Element) {
        super.createExportNode(parentNode, 'milestone');
    }
}
