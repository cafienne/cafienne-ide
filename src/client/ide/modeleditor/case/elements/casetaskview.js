import PlanItem from "@definition/cmmn/caseplan/planitem";
import CaseTaskDefinition from "@definition/cmmn/caseplan/task/casetaskdefinition";
import ShapeDefinition from "@definition/dimensions/shape";
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
        const definition = stage.definition.createPlanItem(CaseTaskDefinition);
        const shape = stage.case.diagram.createShape(x, y, 140, 80, definition.id);
        return new CaseTaskView(stage, definition, shape);
    }

    /**
     * Creates a new CaseTaskView element.
     * @param {StageView} parent 
     * @param {PlanItem} definition
     * @param {CaseTaskDefinition} definition 
     * @param {ShapeDefinition} shape 
     */
    constructor(parent, definition, shape) {
        super(parent, definition, shape);
        this.definition = definition;
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

    get isCaseTask() {
        return true;
    }
}
