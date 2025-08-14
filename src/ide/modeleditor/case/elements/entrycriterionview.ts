import PlanItemTransition from "../../../../repository/definition/cmmn/caseplan/planitemtransition";
import EntryCriterionDefinition from "../../../../repository/definition/cmmn/sentry/entrycriteriondefinition";
import EntryCriterionHalo from "./halo/cmmn/entrycriterionhalo";
import PlanItemView from "./planitemview";
import SentryView from "./sentryview";

export default class EntryCriterionView extends SentryView<EntryCriterionDefinition> {
    static create(planItem: PlanItemView, x: number, y: number) {
        const definition = planItem.definition.createEntryCriterion();
        const shape = planItem.canvas.diagram.createShape(x, y, 12, 20, definition.id);
        return new EntryCriterionView(planItem, definition, shape);
    }

    /**
     *
     * @param {SentryView} target
     */
    __connectSentry(target: SentryView) {
        if (target.isExitCriterion) {
            // Then we need to connect to the exit of the parent of the target;
            const targetParent = target.parent;
            // It does not make sense to listen and start a new plan item when the CasePlan goes exit,
            //  so skip that one.
            if (!(targetParent.isCasePlan)) {
                this.setPlanItemOnPart(targetParent, PlanItemTransition.Exit, target);
            }
        }
    }

    get purpose() {
        const hasRepetition = this.parent.definition.itemControl.repetitionRule != undefined;
        const transition = this.parent.definition.entryTransition;
        return `This condition causes ${hasRepetition ? 'the next ' : ''}'${this.parent.name}' to ${transition}`;
    }

    createHalo() {
        return new EntryCriterionHalo(this);
    }

    get isEntryCriterion() {
        return true;
    }

    get color() {
        return 'white';
    }
}
