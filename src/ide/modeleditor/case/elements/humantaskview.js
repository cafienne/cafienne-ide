import PlanItem from "../../../../repository/definition/cmmn/caseplan/planitem";
import HumanTaskDefinition from "../../../../repository/definition/cmmn/caseplan/task/humantaskdefinition";
import CMMNElementDefinition from "../../../../repository/definition/cmmnelementdefinition";
import ShapeDefinition from "../../../../repository/definition/dimensions/shape";
import PreviewTaskForm from "../editors/task/previewtaskform";
import { HumanTaskHalo } from "./halo/taskhalo";
import HumanTaskProperties from "./properties/humantaskproperties";
import WorkflowProperties from "./properties/workflowproperties";
import StageView from "./stageview";
import TaskView from "./taskview";

const BLOCKINGHUMANTASK_IMG = 'images/svg/blockinghumantask.svg';
const NONBLOCKINGHUMANTASK_IMG = 'images/svg/nonblockinghumantask.svg';
export default class HumanTaskView extends TaskView {
    /**
     * 
     * @param {StageView} stage 
     * @param {*} x 
     * @param {*} y 
     */
    static create(stage, x, y) {
        const definition = stage.definition.createPlanItem(HumanTaskDefinition);
        const shape = stage.case.diagram.createShape(x, y, 140, 80, definition.id);
        return new HumanTaskView(stage, definition, shape);
    }

    /**
     * Creates a new HumanTaskView element.
     * @param {StageView} parent 
     * @param {HumanTaskDefinition} definition 
     * @param {ShapeDefinition} shape 
     */
    constructor(parent, definition, shape) {
        super(parent, definition, shape);
        this.definition = definition;
        this.workflowProperties = new WorkflowProperties(this);
        this.previewForm = new PreviewTaskForm(this);
    }

    getImplementationList() {
        return this.case.editor.ide.repository.getHumanTasks();
    }

    createProperties() {
        return new HumanTaskProperties(this);
    }

    createHalo() {
        return new HumanTaskHalo(this);
    }

    refreshSubViews() {
        super.refreshSubViews();
        if (this.workflowProperties.visible) {
            this.workflowProperties.refresh();
        }
    }

    deleteSubViews() {
        super.deleteSubViews();
        this.workflowProperties.delete();
        this.previewForm.delete();
    }

    showWorkflowProperties() {
        this.workflowProperties.show(true);
    }

    previewTaskForm() {
        this.previewForm.visible = true;
    }

    /**
     * Method invoked after a role or case file item has changed
     * @param {CMMNElementDefinition} definitionElement 
     */
    refreshReferencingFields(definitionElement) {
        super.refreshReferencingFields(definitionElement);
        this.workflowProperties.refresh();
    }

    /**
     * This method may only be invoked from within a human task planning table
     * @param {PlanItem} definition 
     */
    addDiscretionaryItem(definition) {
        this.parent.addDiscretionaryItem(definition);
    }

    /**
     * Returns the element type image for this task
     */
    get imageURL() {
        return this.definition.isBlocking ? BLOCKINGHUMANTASK_IMG : NONBLOCKINGHUMANTASK_IMG;
    }

    get fileType() {
        return 'humantask';
    }

    referencesDefinitionElement(definitionId) {
        if (definitionId == this.definition.performerRef) {
            return true;
        }
        return super.referencesDefinitionElement(definitionId);
    }

    get isHumanTask() {
        return true;
    }
}
