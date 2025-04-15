import Util from "../../../../util/util";
import { Element } from "../../../../util/xml";
import Validator from "../../../validate/validator";
import CaseDefinition from "../casedefinition";
import PlanItem from "../caseplan/planitem";
import PlanItemTransition from "../caseplan/planitemtransition";
import CriterionDefinition from "./criteriondefinition";
import OnPartDefinition from "./onpartdefinition";
import StandardEvent from "./standardevent";

export default class PlanItemOnPartDefinition extends OnPartDefinition<PlanItem> {
    exitCriterionRef: string;

    constructor(importNode: Element, caseDefinition: CaseDefinition, public parent: CriterionDefinition) {
        super(importNode, caseDefinition, parent);
        const cmmn10Ref = this.parseAttribute('sentryRef');
        const exitCriterionRef = this.parseAttribute('exitCriterionRef');
        if (cmmn10Ref && !exitCriterionRef) {
            this.caseDefinition.migrated('Migrating CMMN1.0 sentryRef into exitCriterionRef')
        }
        this.exitCriterionRef = this.parseAttribute('exitCriterionRef', cmmn10Ref);
    }

    parseStandardEvent(value: string): StandardEvent {
        return PlanItemTransition.parse(value);
    }

    validate(validator: Validator) {
        super.validate(validator);
        if (!this.standardEvent.isInvalid && this.source && this.source.transitions.indexOf(this.standardEvent) < 0) {
            validator.raiseError(this.owner, `The ${this.description} in ${this.owner} has an invalid standardEvent '${this.standardEvent.value}' on source '${this.source.name}'. It must be one of [${this.source.transitions.filter(t => !t.isEmpty).join(', ')}]`);
        }
        if (this.source?.isDiscretionary) {
            validator.raiseError(this.owner, `The ${this.description} in ${this.owner} refers to a discretionary element '${this.source.name}'. OnParts cannot be connected to discretionary items`);
        }

        // TODO: Check spec 5.4.9.2 DiscretionaryItem, last bullets, about references to parent stage items for criteria
    }

    get description() {
        return `${Util.ordinal_suffix_of(this.parent.planItemOnParts.indexOf(this) + 1)} PlanItemOnPart`;
    }

    createExportNode(parentNode: Element) {
        super.createExportNode(parentNode, 'planItemOnPart', 'exitCriterionRef');
    }
}
