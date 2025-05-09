import { g } from "jointjs";
import PlanItem from "../../../../repository/definition/cmmn/caseplan/planitem";
import ShapeDefinition from "../../../../repository/definition/dimensions/shape";
import CaseView from "./caseview";
import CMMNElementView from "./cmmnelementview";
import DecoratorBox from "./decorator/decoratorbox";
import PlanItemProperties from "./properties/planitemproperties";
import { EntryCriterionView, ExitCriterionView, ReactivateCriterionView } from "./sentryview";
// import PlanItemHalo from "./halo/planitemhalo";
// BIG TODO HERE

export default class PlanItemView extends CMMNElementView {
    /**
     * This is a generic class for plan item rendering; it takes default properties of the definition
     * It holds a reference both to the PlanItem definition AND to the PlanItemDefinition definition (e.g., HumanTask, StageView, Milestone).
     * @param {CaseView} cs 
     * @param {CMMNElementView} parent 
     * @param {PlanItem} definition
     * @param {ShapeDefinition} shape 
     */
    constructor(cs, parent, definition, shape) {
        super(cs, parent, definition, shape);
        this.definition = definition;

        // Add the sentries
        this.definition.entryCriteria.forEach(criterion => this.addCriterion(criterion, EntryCriterionView));
        this.definition.reactivateCriteria.forEach(criterion => this.addCriterion(criterion, ReactivateCriterionView));
        this.definition.exitCriteria.forEach(criterion => this.addCriterion(criterion, ExitCriterionView));
    }

    addCriterion(criterion, constructorFunction) {
        // If existing shape for criterion is not found, create a new shape.
        const shape = this.case.diagram.getShape(criterion) || this.case.diagram.createShape(this.shape.x - 6, this.shape.y + 10, 12, 20, criterion.id);
        const view = new constructorFunction(this, criterion, shape);
        this.__addCMMNChild(view);
    }

    createProperties() {
        return new PlanItemProperties(this);
    }

    createHalo() {
        return new PlanItemHalo(this);
    }

    createDecoratorBox() {
        return new DecoratorBox(this);
    }

    __resize(w, h) {
        super.__resize(w, h);
        this.decoratorBox.moveDecoratorsToMiddle();
        // reposition our sentries on the right and bottom
        this.__childElements.filter(child => child.isCriterion).forEach(sentry => {
            //get the current position of sentry (the centre)
            const sentryX = sentry.shape.x + sentry.shape.width / 2;
            const sentryY = sentry.shape.y + sentry.shape.height / 2;
            const middleOfSentry = g.point(sentryX, sentryY);
            //find the side of the parent the sentry is nearest to and re-position sentry,
            // but only if it is on the right or bottom side (because we're only resizing, not re-positioning)
            const nearestSide = this.xyz_joint.getBBox().sideNearestToPoint(middleOfSentry);
            if (nearestSide == 'right') {
                sentry.__moveConstraint(this.shape.x + this.shape.width, sentryY);
            } else if (nearestSide == 'bottom') {
                sentry.__moveConstraint(sentryX, this.shape.y + this.shape.height);
            }
        })
    }

    /**
     * shows the element properties as icons in the element
     */
    refreshView() {
        super.refreshView();
        this.decoratorBox.refreshView();
    }

    /**
     * Returns the list of decorator images used in this item.
     * @returns {DecoratorBox}
     */
    get decoratorBox() {
        if (!this._decoratorBox) {
            this._decoratorBox = this.createDecoratorBox();
        }
        return this._decoratorBox;
    }

    createCMMNChild(viewType, x, y) {
        if (viewType == EntryCriterionView) {
            return this.__addCMMNChild(EntryCriterionView.create(this, x, y));
        } else if (viewType == ReactivateCriterionView) {
            return this.__addCMMNChild(ReactivateCriterionView.create(this, x, y));
        } else if (viewType == ExitCriterionView) {
            return this.__addCMMNChild(ExitCriterionView.create(this, x, y));
        } else {
            return super.createCMMNChild(viewType, x, y);
        }
    }

    ruleUsesDefinitionId(ruleName, definitionId) {
        return this.definition.planItemControl && this.definition.planItemControl[ruleName] && this.definition.planItemControl[ruleName].contextRef.references(definitionId);
    }

    referencesDefinitionElement(definitionId) {
        if (this.ruleUsesDefinitionId('repetitionRule', definitionId)) {
            return true;
        }
        if (this.ruleUsesDefinitionId('requiredRule', definitionId)) {
            return true;
        }
        if (this.ruleUsesDefinitionId('manualActivationRule', definitionId)) {
            return true;
        }
    }

    get isPlanItem() {
        return true;
    }
}
