import PlanItem, { TaskStageDefinition } from "@definition/cmmn/caseplan/planitem";
import ShapeDefinition from "@definition/dimensions/shape";
import Util from "@util/util";
import CMMNElementView from "./cmmnelementview";
import Connector from "./connector";
import PlanItemView from "./planitemview";
import PlanningTableView from "./planningtableview";
import CaseView from "./caseview";
import { EntryCriterionView, ExitCriterionView, ReactivateCriterionView } from "./sentryview";

export default class TaskStageView extends PlanItemView {
    /**
     * Simple class to share some logic from TaskView and StageView.
     * @param {CaseView} cs 
     * @param {CMMNElementView} parent 
     * @param {TaskStageDefinition} definition 
     * @param {ShapeDefinition} shape 
     */
    constructor(cs, parent, definition, shape) {
        super(cs, parent, definition, shape);
        this.definition = definition;
        this.showPlanningTable();
    }

    get wrapText() {
        return true;
    }

    /**
     * Returns the location of the planning table for this type of element. Subclasses must implement this method
     * @returns {*} A set of x, y coordinates
     */
    get __planningTablePosition() {
        throw new Error('Planning table position is not set in object of type ' + this.constructor.name);
    }

    /**
     * @param {PlanItem} definition 
     */
    addDiscretionaryItem(definition) {
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
        const className = 'cmmn-discretionary-border';
        const cmmnShape = this.html.find('.cmmn-shape');
        if (this.definition.isDiscretionary) {
            // cmmnShape.addClass(className);
            Util.addClassOverride(cmmnShape, className);
        } else {
            // cmmnShape.removeClass(className);
            Util.removeClassOverride(cmmnShape, className);
        }
    }

    /**
     * Creates a planning table if it does not yet exist, and shows it.
     */
    showPlanningTable() {
        const ptDefinition = this.definition.planningTable;
        if (ptDefinition) {
            // If there is a definition, and we do not yet have a child to render it, then add such a child.
            if (!this.planningTableView) {
                const position = this.__planningTablePosition;
                const shape = this.case.diagram.getShape(ptDefinition) || this.case.diagram.createShape(position.x, position.y, 24, 16, ptDefinition.id);
                new PlanningTableView(this, this.definition.planningTable, shape);
            }
        }
    }

    /**
     * @returns {PlanningTableView}
     */
    get planningTableView() {
        return this.__childElements.find(child => child.isPlanningTable);
    }


    /**
     * Registers a connector with this element.
     * @param {Connector} connector 
     */
    __addConnector(connector) {
        super.__addConnector(connector);
        if (this.definition.isDiscretionary) {
            const target = connector.source == this ? connector.target : connector.source;
            if (target.isHumanTask) {
                // We are discretionary, and need to be added to the discretionary items in the planning table of the HumanTaskView
                this.definition.switchParent(target.definition);
            }
            this.parent.refreshView();
        }
    }

    /**
     * Removes a connector from the registration in this element.
     * @param {Connector} connector 
     */
    __removeConnector(connector) {
        super.__removeConnector(connector);
        if (this.definition.isDiscretionary) {
            const target = connector.source == this ? connector.target : connector.source;
            if (target.isHumanTask) { // If target is HumanTaskView, then we are the StageView containing that task.
                this.definition.switchParent(target.parent.definition);
                this.parent.refreshView();
            }
        }
    }

    referencesDefinitionElement(definitionId) {
        // This checks for discretionary items' authorizedRoles
        if (this.definition.isDiscretionary && this.definition.authorizedRoles.find(role => role.id == definitionId)) {
            return true;
        }
        return super.referencesDefinitionElement(definitionId);
    }

    canHaveCriterion(criterionType) {
        return criterionType == EntryCriterionView || criterionType == ReactivateCriterionView || criterionType == ExitCriterionView;
    }

    get isTaskOrStage() {
        return true;
    }
}
