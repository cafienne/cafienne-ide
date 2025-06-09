import SentryView from "./sentryview";
// import { EntryCriterionHalo, ExitCriterionHalo, ReactivateCriterionHalo } from "./halo/sentryhalo";
// BIG TODO HERE

export default class EntryCriterionView extends SentryView {
    static create(planItem, x, y) {
        const definition = planItem.definition.createEntryCriterion();
        const shape = planItem.case.diagram.createShape(x, y, 12, 20, definition.id);
        return new EntryCriterionView(planItem, definition, shape);
    }

    /**
     *
     * @param {SentryView} target
     */
    __connectSentry(target) {
        if (target.isExitCriterion) {
            // Then we need to connect to the exit of the parent of the target;
            const targetParent = target.parent;
            // It does not make sense to listen and start a new plan item when the CasePlan goes exit,
            //  so skip that one.
            if (!(targetParent.isCasePlan)) {
                this.setPlanItemOnPart(targetParent, 'exit', target);
            }
        }
    }

    get purpose() {
        const hasRepetition = this.planItem.definition.planItemControl.repetitionRule != undefined;
        const transition = this.planItem.definition.entryTransition;
        return `This condition causes ${hasRepetition ? 'the next ' : ''}'${this.planItem.name}' to ${transition}`;
    }

    createHalo() {
        return new EntryCriterionHalo(this);
    }

    get isEntryCriterion() {
        return true;
    }
}
