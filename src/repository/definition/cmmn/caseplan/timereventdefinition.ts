import CaseDefinition from "../casedefinition";
import ExpressionDefinition from "../expression/expressiondefinition";
import OnPartDefinition from "../sentry/onpartdefinition";
import EventListenerDefinition from "./eventlistenerdefinition";
import { TaskStageDefinition } from "./planitem";
import PlanningTableDefinition from "./planningtabledefinition";

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

export class PlanItemStartTrigger extends OnPartDefinition {
    createExportNode(parentNode: Element) {
        super.createExportNode(parentNode, 'planItemStartTrigger');
    }
}

export class CaseFileItemStartTrigger extends OnPartDefinition {
    createExportNode(parentNode: Element) {
        super.createExportNode(parentNode, 'caseFileItemStartTrigger');
    }
}
