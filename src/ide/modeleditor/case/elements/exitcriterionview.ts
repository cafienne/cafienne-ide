import ExitCriterionDefinition from "../../../../repository/definition/cmmn/sentry/exitcriteriondefinition";
import ExitCriterionHalo from "./halo/cmmn/exitcriterionhalo";
import PlanItemView from "./planitemview";
import SentryView from "./sentryview";

export default class ExitCriterionView extends SentryView<ExitCriterionDefinition> {
    /**
     *
     * @param {PlanItemView} planItem
     * @param {*} x
     * @param {*} y
     */
    static create(planItem: PlanItemView, x: number, y: number) {
        const definition = planItem.definition.createExitCriterion();
        const shape = planItem.case.diagram.createShape(x, y, 12, 20, definition.id);
        return new ExitCriterionView(planItem, definition, shape);
    }

    get purpose() {
        return `This condition causes '${this.parent.name}' to stop`;
    }

    createHalo() {
        return new ExitCriterionHalo(this);
    }

    get isExitCriterion() {
        return true;
    }
}
