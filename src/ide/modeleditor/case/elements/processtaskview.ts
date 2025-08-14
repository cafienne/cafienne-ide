import ProcessTaskDefinition from "../../../../repository/definition/cmmn/caseplan/task/processtaskdefinition";
import ShapeDefinition from "../../../../repository/definition/dimensions/shape";
import Images from "../../../util/images/images";
import StageView from "./stageview";
import TaskView from "./taskview";

export default class ProcessTaskView extends TaskView {

    /**
     * Create a new ProcessTaskView at the given coordinates.
     */
    static create(stage: StageView, x: number, y: number): ProcessTaskView {
        const definition = stage.definition.createPlanItem(ProcessTaskDefinition);
        const shape = stage.canvas.diagram.createShape(x, y, 140, 80, definition.id);
        return new ProcessTaskView(stage, definition, shape);
    }

    /**
     * Creates a new ProcessTaskView element.
     */
    constructor(parent: StageView, definition: ProcessTaskDefinition, shape: ShapeDefinition) {
        super(parent, definition, shape);
    }

    getImplementationList() {
        return this.editor.ide.repository.getProcesses();
    }

    /**
     * Returns the element type image for this task
     */
    get imageURL() {
        return Images.ProcessTask;
    }

    get fileType() {
        return 'process';
    }

    get isProcessTask() {
        return true;
    }

    get color() {
        return 'rgb(103, 133, 216)';
    }
}
