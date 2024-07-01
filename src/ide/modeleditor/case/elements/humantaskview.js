import PlanItem from "@definition/cmmn/caseplan/planitem";
import HumanTaskDefinition from "@definition/cmmn/caseplan/task/humantaskdefinition";
import CMMNElementDefinition from "@definition/cmmnelementdefinition";
import ShapeDefinition from "@definition/dimensions/shape";
import PreviewTaskForm from "../editors/task/previewtaskform";
import HumanTaskProperties from "./properties/humantaskproperties";
import WorkflowProperties from "./properties/workflowproperties";
import StageView from "./stageview";
import TaskView from "./taskview";
import { HumanTaskHalo } from "./halo/taskhalo";

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
        const definition = stage.planItemDefinition.createPlanItem(HumanTaskDefinition);
        const shape = stage.case.diagram.createShape(x, y, 140, 80, definition.id);
        return new HumanTaskView(stage, definition, definition.definition, shape);
    }

    /**
     * Creates a new HumanTaskView element.
     * @param {StageView} parent 
     * @param {PlanItem} definition
     * @param {HumanTaskDefinition} planItemDefinition 
     * @param {ShapeDefinition} shape 
     */
    constructor(parent, definition, planItemDefinition, shape) {
        super(parent, definition, planItemDefinition, shape);
        this.planItemDefinition = planItemDefinition;
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
        return this.planItemDefinition.isBlocking ? BLOCKINGHUMANTASK_IMG : NONBLOCKINGHUMANTASK_IMG;
    }

    get fileType() {
        return 'humantask';
    }

    referencesDefinitionElement(definitionId) {
        if (definitionId == this.planItemDefinition.performerRef) {
            return true;
        }
        return super.referencesDefinitionElement(definitionId);
    }

    get isHumanTask() {
        return true;
    }
}
