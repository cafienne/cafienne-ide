import ValidationContext from "@repository/validate/validation";
import { MilestoneEventListenerDefinition } from "./planitem";

export default class MilestoneDefinition extends MilestoneEventListenerDefinition {
    static get infix() {
        return 'ms';
    }

    createExportNode(parentNode: Element) {
        super.createExportNode(parentNode, 'milestone');
    }
    validate(validationContext: ValidationContext) 
    {
        if (this.itemControl.repetitionRule) {
            if (this.entryCriteria.length == 0) {
                if(this instanceof MilestoneDefinition) {
                    this.raiseError('Item "-par0-" has a repetition rule defined, but no entry criteria. This is mandatory for milestones.',
                        [this.name]);
                }
            } 
        }
    }
}
