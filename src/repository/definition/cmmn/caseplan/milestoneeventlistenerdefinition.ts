import Validator from "../../../validate/validator";
import PlanItem from "./planitem";
import PlanItemTransition from "./planitemtransition";

/**
 * Simple helper class to re-use logic across milestones and event listeners
 */
export default class MilestoneEventListenerDefinition extends PlanItem {
    validate(validator: Validator): void {
        // Cannot have exit criteria
        if (this.exitCriteria.length > 0) {
            validator.raiseError(this, 'Cannot have exit criteria defined');
        }        
    }

    get transitions() {
        return MilestoneEventListenerTransition.values;
    }

    get defaultTransition() {
        return MilestoneEventListenerTransition.Occur;
    }

    get entryTransition() {
        return MilestoneEventListenerTransition.Occur;
    }
}

export class MilestoneEventListenerTransition extends PlanItemTransition {
    static get values(): PlanItemTransition[] {
        return [
            PlanItemTransition.None,
            PlanItemTransition.Occur,
            PlanItemTransition.Create,
            PlanItemTransition.Reactivate,
            PlanItemTransition.Resume,
            PlanItemTransition.Suspend,
            PlanItemTransition.Terminate
        ];
    }
}
