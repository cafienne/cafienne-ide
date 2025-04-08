import { Element } from "../../../../util/xml";
import CaseDefinition from "../casedefinition";
import CaseFileItemDef from "../casefile/casefileitemdef";
import CaseFileItemTransition from "../casefile/casefileitemtransition";
import ExpressionDefinition from "../expression/expressiondefinition";
import OnPartDefinition from "../sentry/onpartdefinition";
import StandardEvent from "../sentry/standardevent";
import EventListenerDefinition from "./eventlistenerdefinition";
import PlanItem from "./planitem";
import PlanItemTransition from "./planitemtransition";
import PlanningTableDefinition from "./planning/planningtabledefinition";
import TaskStageDefinition from "./taskstagedefinition";

export default class TimerEventDefinition extends EventListenerDefinition {
    timerExpression?: ExpressionDefinition;
    planItemStartTrigger?: PlanItemStartTrigger;
    caseFileItemStartTrigger?: CaseFileItemStartTrigger;
    static get infix() {
        return 'tmr';
    }

    constructor(importNode: Element, caseDefinition: CaseDefinition, public parent: TaskStageDefinition | PlanningTableDefinition) {
        super(importNode, caseDefinition, parent);
        this.timerExpression = this.parseElement('timerExpression', ExpressionDefinition);
        this.planItemStartTrigger = this.parseElement('planItemStartTrigger', PlanItemStartTrigger);
        this.caseFileItemStartTrigger = this.parseElement('caseFileItemStartTrigger', CaseFileItemStartTrigger);

        if (!this.planItemStartTrigger && !this.caseFileItemStartTrigger){
            //planItemStartTrigger is default
            this.planItemStartTrigger = this.getPlanItemStartTrigger();
        }
    }

    getTimerExpression() {
        if (!this.timerExpression) {
            this.timerExpression = super.createDefinition(ExpressionDefinition);
            this.timerExpression.name = '';
        }
        return this.timerExpression;
    }

    getCaseFileItemStartTrigger() {
        if (!this.caseFileItemStartTrigger) {
            this.caseFileItemStartTrigger = super.createDefinition(CaseFileItemStartTrigger);
            if (this.planItemStartTrigger) {
                this.planItemStartTrigger.removeDefinition();
            }
        }
        return this.caseFileItemStartTrigger;
    }

    getPlanItemStartTrigger() {
        if (!this.planItemStartTrigger) {
            this.planItemStartTrigger = super.createDefinition(PlanItemStartTrigger);
            if (this.caseFileItemStartTrigger) {
                this.caseFileItemStartTrigger.removeDefinition();
            }
        }
        return this.planItemStartTrigger;
    }

    createExportNode(parentNode: Element) {
        super.createExportNode(parentNode, 'timerEvent', 'timerExpression', 'planItemStartTrigger', 'caseFileItemStartTrigger');
    }
}

export class PlanItemStartTrigger extends OnPartDefinition<PlanItem> {
    createExportNode(parentNode: Element) {
        super.createExportNode(parentNode, 'planItemStartTrigger');
    }

    parseStandardEvent(value: string): StandardEvent {
        return PlanItemTransition.parse(value);
    }

    get description() {
        return 'plan item start trigger';
    }
}

export class CaseFileItemStartTrigger extends OnPartDefinition<CaseFileItemDef> {
    createExportNode(parentNode: Element) {
        super.createExportNode(parentNode, 'caseFileItemStartTrigger');
    }

    parseStandardEvent(value: string): StandardEvent {
        return CaseFileItemTransition.parse(value);
    }

    get description() {
        return 'case file item start trigger';
    }
}
