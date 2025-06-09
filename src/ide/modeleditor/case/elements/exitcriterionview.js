import SentryView from "./sentryview";
// import { EntryCriterionHalo, ExitCriterionHalo, ReactivateCriterionHalo } from "./halo/sentryhalo";
// BIG TODO HERE


export default class ExitCriterionView extends SentryView {
    /**
     *
     * @param {PlanItemView} planItem
     * @param {*} x
     * @param {*} y
     */
    static create(planItem, x, y) {
        const definition = planItem.definition.createExitCriterion();
        const shape = planItem.case.diagram.createShape(x, y, 12, 20, definition.id);
        return new ExitCriterionView(planItem, definition, shape);
    }

    get purpose() {
        return `This condition causes '${this.planItem.name}' to stop`;
    }

    createHalo() {
        return new ExitCriterionHalo(this);
    }

    get isExitCriterion() {
        return true;
    }
}
