import { g } from '@joint/core';
import PlanItem from "../../../../repository/definition/cmmn/caseplan/planitem";
import CriterionDefinition from "../../../../repository/definition/cmmn/sentry/criteriondefinition";
import ShapeDefinition from "../../../../repository/definition/dimensions/shape";
import CaseView from "./caseview";
import CMMNElementView from "./cmmnelementview";
import DecoratorBox from "./decorator/decoratorbox";
import EntryCriterionView from "./entrycriterionview";
import ExitCriterionView from "./exitcriterionview";
import PlanItemProperties from "./properties/planitemproperties";
import ReactivateCriterionView from "./reactivatecriterionview";

export default abstract class PlanItemView<PI extends PlanItem = PlanItem> extends CMMNElementView<PI> {
    _decoratorBox?: DecoratorBox;

    /**
     * This is a generic class for plan item rendering; it takes default properties of the definition
     * It holds a reference both to the PlanItem definition AND to the PlanItemDefinition definition (e.g., HumanTask, StageView, Milestone).
     */
    constructor(cs: CaseView, parent: CMMNElementView | undefined, definition: PI, shape: ShapeDefinition) {
        super(cs, parent, definition, shape);
        // Add the sentries
        this.definition.entryCriteria.forEach(criterion => this.addCriterion(criterion, EntryCriterionView));
        this.definition.reactivateCriteria.forEach(criterion => this.addCriterion(criterion, ReactivateCriterionView));
        this.definition.exitCriteria.forEach(criterion => this.addCriterion(criterion, ExitCriterionView));
    }

    addCriterion(criterion: CriterionDefinition, constructorFunction: new (parent: PlanItemView, criterion: any, shape: ShapeDefinition) => any) {
        // If existing shape for criterion is not found, create a new shape.
        const shape = this.case.diagram.getShape(criterion) || this.case.diagram.createShape(this.shape.x - 6, this.shape.y + 10, 12, 20, criterion.id);
        const view = new constructorFunction(this, criterion, shape);
        this.__addCMMNChild(view);
    }

    createProperties(): PlanItemProperties<any> {
        return new PlanItemProperties(this);
    }

    createDecoratorBox() {
        return new DecoratorBox(this);
    }

    resizing(w: number, h: number) {
        super.resizing(w, h);
        this.decoratorBox.moveDecoratorsToMiddle();
        // reposition our sentries on the right and bottom
        this.__childElements.filter(child => child.isCriterion).forEach((sentry: any) => {
            //get the current position of sentry (the centre)
            const sentryX = sentry.shape.x + sentry.shape.width / 2;
            const sentryY = sentry.shape.y + sentry.shape.height / 2;
            const middleOfSentry = new g.Point(sentryX, sentryY);
            //find the side of the parent the sentry is nearest to and re-position sentry,
            // but only if it is on the right or bottom side (because we're only resizing, not re-positioning)
            const nearestSide = this.xyz_joint.getBBox().sideNearestToPoint(middleOfSentry);
            if (nearestSide == 'right') {
                sentry.moving(this.shape.x + this.shape.width, sentryY);
            } else if (nearestSide == 'bottom') {
                sentry.moving(sentryX, this.shape.y + this.shape.height);
            }
        });
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
     */
    get decoratorBox(): DecoratorBox {
        if (!this._decoratorBox) {
            this._decoratorBox = this.createDecoratorBox();
        }
        return this._decoratorBox;
    }

    createCMMNChild(viewType: Function, x: number, y: number): CMMNElementView<any> {
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

    referencesDefinitionElement(definitionId: string) {
        if (this.definition.itemControl.repetitionRule?.contextRef.references(definitionId)) {
            return true;
        }
        if (this.definition.itemControl.requiredRule?.contextRef.references(definitionId)) {
            return true;
        }
        if (this.definition.itemControl.manualActivationRule?.contextRef.references(definitionId)) {
            return true;
        }
        return super.referencesDefinitionElement(definitionId);
    }

    get isPlanItem() {
        return true;
    }
}
