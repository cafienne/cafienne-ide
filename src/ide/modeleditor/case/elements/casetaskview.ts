import CaseTaskDefinition from "../../../../repository/definition/cmmn/caseplan/task/casetaskdefinition";
import ShapeDefinition from "../../../../repository/definition/dimensions/shape";
import Images from "../../../util/images/images";
import StageView from "./stageview";
import TaskView from "./taskview";

export default class CaseTaskView extends TaskView<CaseTaskDefinition> {
    /**
     * Create a new CaseTaskView at the given coordinates.
     */
    static create(stage: StageView, x: number, y: number): CaseTaskView {
        const definition = stage.definition.createPlanItem(CaseTaskDefinition);
        const shape = stage.canvas.diagram.createShape(x, y, 140, 80, definition.id);
        return new CaseTaskView(stage, definition, shape);
    }

    /**
     * Creates a new CaseTaskView element.
     */
    constructor(parent: StageView, definition: CaseTaskDefinition, shape: ShapeDefinition) {
        super(parent, definition, shape);
    }

    getImplementationList() {
        return this.editor.ide.repository.getCases();
    }

    /**
     * Returns the element type image for this task
     */
    get imageURL() {
        return Images.CaseTask;
    }

    get fileType() {
        return 'case';
    }

    get isCaseTask() {
        return true;
    }

    get color() {
        return 'rgb(103, 133, 216)';
    }
}
