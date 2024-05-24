import PlanItem from "../../../../repository/definition/cmmn/definitions/caseplan/planitem";
import ProcessTaskDefinition from "../../../../repository/definition/cmmn/definitions/caseplan/task/processtaskdefinition";
import ShapeDefinition from "../../../../repository/definition/cmmn/dimensions/shape";
import CMMNElementView from "./cmmnelementview";
import StageView from "./stageview";
import TaskView from "./taskview";

export default class ProcessTaskView extends TaskView {
    /**
     * 
     * @param {StageView} stage 
     * @param {*} x 
     * @param {*} y 
     */
    static create(stage, x, y) {
        const definition = stage.planItemDefinition.createPlanItem(ProcessTaskDefinition);
        const shape = stage.case.diagram.createShape(x, y, 140, 80, definition.id);
        if (definition.definition instanceof ProcessTaskDefinition) {
            return new ProcessTaskView(stage, definition, definition.definition, shape);
        }
        console.error('Not supposed to reach this code');
    }

    /**
     * Creates a new ProcessTaskView element.
     * @param {CMMNElementView} parent 
     * @param {PlanItem} definition
     * @param {ProcessTaskDefinition} planItemDefinition 
     * @param {ShapeDefinition} shape 
     */
    constructor(parent, definition, planItemDefinition, shape) {
        super(parent, definition, planItemDefinition, shape);
        this.planItemDefinition = planItemDefinition;
    }

    getImplementationList() {
        return this.editor.ide.repository.getProcesses();
    }

    /**
     * Returns the element type image for this task
     */
    get imageURL() {
        return 'images/svg/processtask.svg';
    }

    get fileType() {
        return 'process';
    }
}
CMMNElementView.registerType(ProcessTaskView, 'Process TaskView', 'images/svg/processtaskmenu.svg', 'images/processtaskmenu_32.png');
