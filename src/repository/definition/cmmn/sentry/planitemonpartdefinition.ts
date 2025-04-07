import Util from "../../../../util/util";
import { Element } from "../../../../util/xml";
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

    get description() {
        return `${Util.ordinal_suffix_of(this.parent.planItemOnParts.indexOf(this))} plan item on part`;
    }

    createExportNode(parentNode: Element) {
        super.createExportNode(parentNode, 'planItemOnPart', 'exitCriterionRef');
    }
}
