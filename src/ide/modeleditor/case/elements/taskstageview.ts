import PlanItem from "../../../../repository/definition/cmmn/caseplan/planitem";
import HumanTaskDefinition from "../../../../repository/definition/cmmn/caseplan/task/humantaskdefinition";
import TaskStageDefinition from "../../../../repository/definition/cmmn/caseplan/taskstagedefinition";
import ShapeDefinition from "../../../../repository/definition/dimensions/shape";
import CaseCanvas from "./casecanvas";
import CaseElementView from "./caseelementview";
import CaseConnector from "./connector/caseconnector";
import EntryCriterionView from "./entrycriterionview";
import ExitCriterionView from "./exitcriterionview";
import PlanItemView from "./planitemview";
import PlanningTableView from "./planningtableview";
import ReactivateCriterionView from "./reactivatecriterionview";

export default abstract class TaskStageView<TS extends TaskStageDefinition = TaskStageDefinition> extends PlanItemView<TS> {

    /**
     * Simple class to share some logic from TaskView and StageView.
     */
    constructor(canvas: CaseCanvas, parent: CaseElementView | undefined, definition: TS, shape: ShapeDefinition) {
        super(canvas, parent, definition, shape);
        this.showPlanningTable();
    }

    get wrapText() {
        return true;
    }

    /**
     * Returns the location of the planning table for this type of element. Subclasses must implement this method
     */
    abstract get __planningTablePosition(): { x: number; y: number };
    /**
     * Add a discretionary item to this stage or task.
     */
    addDiscretionaryItem(definition: PlanItem) {
        throw new Error('This method must be implemented in subclasses');
    }

    refreshView() {
        super.refreshView();
        this.showPlanningTable();
        this.refreshDiscretionaryBorder();
    }

    /**
     * Renders the element border freshly, based on whether this is a discretionary item or not.
     */
    refreshDiscretionaryBorder() {
        this.xyz_joint.attr("body/stroke-dasharray", this.definition.isDiscretionary ? '10 5' : 'none');
    }

    /**
     * Creates a planning table if it does not yet exist, and shows it.
     */
    showPlanningTable() {
        if (this.definition.planningTable) {
            if (!this.planningTableView) {
                const position = this.__planningTablePosition;
                const shape = this.canvas.diagram.getShape(this.definition.planningTable) || this.canvas.diagram.createShape(position.x, position.y, 24, 16, this.definition.planningTable.id);
                new PlanningTableView(this, this.definition.planningTable, shape);
            }
        }
    }

    /**
     * Returns the PlanningTableView child, if present.
     */
    get planningTableView(): PlanningTableView | undefined {
        return this.__childElements.find(child => child.isPlanningTable) as PlanningTableView | undefined;
    }

    /**
     * Registers a connector with this element.
     */
    __addConnector(connector: CaseConnector) {
        super.__addConnector(connector);
        if (this.definition.isDiscretionary) {
            const target = connector.source == this ? connector.target : connector.source;
            if (target.isHumanTask) {
                // We are discretionary, and need to be added to the discretionary items in the planning table of the HumanTaskView
                this.definition.switchParent(target.definition as HumanTaskDefinition);
            }
            this.parent?.refreshView();
        }
    }

    /**
     * Removes a connector from the registration in this element.
     */
    __removeConnector(connector: CaseConnector) {
        super.__removeConnector(connector);
        if (this.definition.isDiscretionary) {
            const target = connector.source == this ? connector.target : connector.source;
            if (target.isHumanTask) {
                this.definition.switchParent(target.parent!.definition as HumanTaskDefinition);
                this.parent?.refreshView();
            }
        }
    }

    referencesDefinitionElement(definitionId: string) {
        // This checks for discretionary items' authorizedRoles
        if (this.definition.isDiscretionary && this.definition.authorizedRoles.find(role => role.id == definitionId)) {
            return true;
        }
        return super.referencesDefinitionElement(definitionId);
    }

    canHaveCriterion(criterionType: Function) {
        return (
            criterionType == EntryCriterionView ||
            criterionType == ReactivateCriterionView ||
            criterionType == ExitCriterionView
        );
    }

    get isTaskOrStage() {
        return true;
    }
}
