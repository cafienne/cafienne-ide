import PlanItem from "@definition/cmmn/caseplan/planitem";
import ProcessTaskDefinition from "@definition/cmmn/caseplan/task/processtaskdefinition";
import ShapeDefinition from "@definition/dimensions/shape";
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
        const definition = stage.definition.createPlanItem(ProcessTaskDefinition);
        const shape = stage.case.diagram.createShape(x, y, 140, 80, definition.id);
        return new ProcessTaskView(stage, definition, shape);
    }

    /**
     * Creates a new ProcessTaskView element.
     * @param {StageView} parent 
     * @param {ProcessTaskDefinition} definition 
     * @param {ShapeDefinition} shape 
     */
    constructor(parent, definition, shape) {
        super(parent, definition, shape);
        this.definition = definition;
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

    get isProcessTask() {
        return true;
    }
}
