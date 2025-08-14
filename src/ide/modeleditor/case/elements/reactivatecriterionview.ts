import ReactivateCriterionDefinition from "../../../../repository/definition/cmmn/sentry/reactivatecriteriondefinition";
import ReactivateCriterionHalo from "./halo/cmmn/reactivatecriterionhalo";
import PlanItemView from "./planitemview";
import SentryView from "./sentryview";

export default class ReactivateCriterionView extends SentryView<ReactivateCriterionDefinition> {
    static create(planItem: PlanItemView, x: number, y: number) {
        const definition = planItem.definition.createReactivateCriterion();
        const shape = planItem.canvas.diagram.createShape(x, y, 12, 20, definition.id);
        return new ReactivateCriterionView(planItem, definition, shape);
    }

    get markup() {
        return `<path @selector='body' style="pointer-events: bounding-box;"  d="M 3.827 2.137 L 9.807 1.377 L 5.657 8.494 L 11.141 7.923 L 2.696 19.454 L 5.157 11.663 L 0.787 12.164 C 0.85 12.173 3.827 2.137 3.827 2.137 Z" />`;
    }

    get color() {
        return 'white';
    }

    get purpose() {
        return `This condition causes '${this.parent.name}' to reactivate - if it is in failed state`;
    }

    createHalo() {
        return new ReactivateCriterionHalo(this);
    }

    get isReactivateCriterion() {
        return true;
    }
}
