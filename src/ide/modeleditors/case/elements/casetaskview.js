import PlanItem from "../../../../repository/definition/cmmn/definitions/caseplan/planitem";
import CaseTaskDefinition from "../../../../repository/definition/cmmn/definitions/caseplan/task/casetaskdefinition";
import ShapeDefinition from "../../../../repository/definition/cmmn/dimensions/shape";
import CMMNElementView from "./cmmnelementview";
import StageView from "./stageview";
import TaskView from "./taskview";

export default class CaseTaskView extends TaskView {
    /**
     * 
     * @param {StageView} stage 
     * @param {*} x 
     * @param {*} y 
     */
    static create(stage, x, y) {
        const definition = stage.planItemDefinition.createPlanItem(CaseTaskDefinition);
        const shape = stage.case.diagram.createShape(x, y, 140, 80, definition.id);
        if (definition.definition instanceof CaseTaskDefinition) {
            return new CaseTaskView(stage, definition, definition.definition, shape);
        }
        console.error('Not supposed to reach this code');
    }

    /**
     * Creates a new CaseTaskView element.
     * @param {CMMNElementView} parent 
     * @param {PlanItem} definition
     * @param {CaseTaskDefinition} planItemDefinition 
     * @param {ShapeDefinition} shape 
     */
    constructor(parent, definition, planItemDefinition, shape) {
        super(parent, definition, planItemDefinition, shape);
        this.planItemDefinition = planItemDefinition;
    }

    getImplementationList() {
        return this.editor.ide.repository.getCases();
    }

    /**
     * Returns the element type image for this task
     */
    get imageURL() {
        return 'images/svg/casetask.svg';
    }

    get fileType() {
        return 'case';
    }
}
CMMNElementView.registerType(CaseTaskView, 'Case TaskView', 'images/svg/casetaskmenu.svg', 'images/casetaskmenu_32.png');
