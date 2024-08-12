import PlanItem from "@definition/cmmn/caseplan/planitem";
import { TaskStageDefinition } from "@definition/cmmn/caseplan/planitemdefinitiondefinition";
import ShapeDefinition from "@definition/dimensions/shape";
import Util from "@util/util";
import CMMNElementView from "./cmmnelementview";
import Connector from "./connector";
import PlanItemView from "./planitemview";
import PlanningTableView from "./planningtableview";

export default class TaskStageView extends PlanItemView {
    /**
     * Simple class to share some logic from TaskView and StageView.
     * @param {CaseView} cs 
     * @param {CMMNElementView} parent 
     * @param {PlanItem} definition 
     * @param {TaskStageDefinition} planItemDefinition 
     * @param {ShapeDefinition} shape 
     */
    constructor(cs, parent, definition, planItemDefinition, shape) {
        super(cs, parent, definition, shape);
        this.planItemDefinition = planItemDefinition;
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
        const ptDefinition = this.planItemDefinition.planningTable;
        if (ptDefinition) {
            // If there is a definition, and we do not yet have a child to render it, then add such a child.
            if (!this.planningTableView) {
                const position = this.__planningTablePosition;
                const shape = this.case.diagram.getShape(ptDefinition) || this.case.diagram.createShape(position.x, position.y, 24, 16, ptDefinition.id);
                new PlanningTableView(this, this.planItemDefinition.planningTable, shape);
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
                this.definition.switchParent(target.planItemDefinition);
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
                this.definition.switchParent(target.parent.planItemDefinition);
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

    __validate() {
        super.__validate();

        // Check discretionary
        if (this.definition.isDiscretionary) {
            // ------- check if connected to a stage or task with a planning table first check connected to element with planningTable
            const numberOfConnectionsToPlanningTable = this.__getConnectedElements().filter(item => item.isTaskOrStage && item.planItemDefinition.planningTable).length;
            //not connected check if inside stage/case plan model with plannnigTable
            if (numberOfConnectionsToPlanningTable == 0) {
                // not connected to task with planningTable check if parent is stage or case plan
                // model with planningTable
                const cmmnParent = this.parent;
                if (cmmnParent && cmmnParent.isTaskOrStage) {
                    if (!cmmnParent.planItemDefinition.planningTable) {
                        this.raiseValidationIssue(20);
                    }
                } else {
                    this.raiseValidationIssue(20);
                }
            } else {
                if (numberOfConnectionsToPlanningTable >= 2) {
                    this.raiseValidationIssue(21);
                }
            }

            // Authorized roles must be filled with an ID attribute.
            this.definition.authorizedRoles.filter(r => !r.id).forEach(r => this.raiseValidationIssue(40));
        }
    }

    canHaveCriterion(criterionType) {
        return criterionType == EntryCriterionView.name || criterionType == ReactivateCriterionView.name || criterionType == ExitCriterionView.name;
    }

    get isTaskOrStage() {
        return true;
    }
}
