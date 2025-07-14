import { g } from '@joint/core';
import PlanningTableDefinition from "../../../../repository/definition/cmmn/caseplan/planning/planningtabledefinition";
import ShapeDefinition from "../../../../repository/definition/dimensions/shape";
import Images from "../../../util/images/images";
import CMMNElementView from "./cmmnelementview";
import PlanningTableHalo from "./halo/cmmn/planningtablehalo";
import PlanningTableProperties from "./properties/planningtableproperties";
import StageView from "./stageview";
import TaskStageView from "./taskstageview";

export default class PlanningTableView extends CMMNElementView<PlanningTableDefinition> {
    stage: TaskStageView;

    constructor(public parent: TaskStageView, definition: PlanningTableDefinition, shape: ShapeDefinition) {
        super(parent.case, parent, definition, shape);
        this.parent = parent;
        this.__resizable = false;
        parent.__addCMMNChild(this);

        this.stage = this.parent.isStage ? this.parent as StageView : this.parent.parent as StageView;
        // Now also render the discretionary items from the definition in our parent
        this.definition.tableItems.forEach(item => this.parent.addDiscretionaryItem(item));
    }

    /**
     * Override select in both planningtable and sentry to immediately show properties.
     */
    __select(selected: boolean) {
        super.__select(selected);
        if (selected) {
            this.propertiesView.show();
        }
    }

    createProperties() {
        return new PlanningTableProperties(this);
    }

    createHalo() {
        return new PlanningTableHalo(this);
    }

    get markup() {
        return `<rect @selector='body'/>
                <image href="${Images.PlanningTable}" x="1" y="-3" width="24" height="24" />`;
    }

    get markupAttributes() {
        return {
            body: {
                stroke: 'transparent',
                width: 28,
                height: 20,
                x: -1,
                y: -1,
            }
        };
    }

    /**
     * Deleting the planning table should also inform our parent that we're gone...
     */
    __delete() {
        // First make all discretionary items non-discretionary, in order not to lose their drawings.
        this.definition.tableItems.map(i => i).forEach(item => item.switchType());
        // Invoke super logic, but only after switching type of our discretionary items,
        // otherwise the pointers are lost since super.__delete() removes the definition.
        super.__delete();
        // Render the stage again, in order to remove dotted lines from the converted former discretionary items
        this.stage.refreshView();
    }

    moved(x: number, y: number, newParent: CMMNElementView) {
        this.moving(x, y);
    }

    /**
     * A planningTable has a fixed position on its parent, it cannot be moved.
     * Position cursor is not relevant
     */
    moving(x: number, y: number) {
        const parentX = this.parent.shape.x;
        const parentY = this.parent.shape.y;
        // create a point relative to the parentElement, where the planningTable must be positioned relative to the parent
        const point = new g.Point(parentX + this.parent.__planningTablePosition.x, parentY + this.parent.__planningTablePosition.y);

        // get the absolute position of the planningTable
        // NOTE: Planning Table does NOT yet store a CMMNShape object. It would be better if it did... Now we have to use joint :(
        const ptX = this.shape.x;
        const ptY = this.shape.y;

        // position planningTable with respect to the parent
        const translateX = point.x - ptX;
        const translateY = point.y - ptY;

        this.xyz_joint.translate(translateX, translateY);
    }

    referencesDefinitionElement(definitionId: string) {
        // check in applicability rules; note: we're checking sourceRef, but it ought to be contextRef...
        if (this.definition.ruleDefinitions.find(rule => rule.sourceRef.references(definitionId))) {
            return true;
        }
        return super.referencesDefinitionElement(definitionId);
    }

    get isPlanningTable() {
        return true;
    }
}
