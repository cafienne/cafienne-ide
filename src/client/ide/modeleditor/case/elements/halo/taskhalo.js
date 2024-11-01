import HumanTaskView from "../humantaskview";
import TaskView from "../taskview";
import { DeleteHaloItem, InputParametersHaloItem, InvalidPreviewTaskFormHaloItem, NewTaskImplemenationHaloItem, OutputParametersHaloItem, PreviewTaskFormHaloItem, PropertiesHaloItem, WorkflowHaloItem, ZoomTaskImplementationHaloItem } from "./item/haloclickitems";
import { ConnectorHaloItem, EntryCriterionHaloItem, ExitCriterionHaloItem, ReactivateCriterionHaloItem } from "./item/halodragitems";
import PlanItemHalo from "./planitemhalo";

export default class TaskHalo extends PlanItemHalo {
    /**
     * Create the halo for the task.
     * @param {TaskView} element 
     */
    constructor(element) {
        super(element);
        this.element = element;
    }

    createItems() {
        super.createItems();
        if (this.element.definition.implementationRef) {
            this.addItems(ZoomTaskImplementationHaloItem, InputParametersHaloItem, OutputParametersHaloItem);
        } else {
            this.addItems(NewTaskImplemenationHaloItem);
        }
    }
}

export class HumanTaskHalo extends TaskHalo {
    /**
     * Create the halo for the task.
     * @param {HumanTaskView} element 
     */
    constructor(element) {
        super(element);
        this.element = element;
    }

    createItems() {
        const task = this.element;
        this.addItems(ConnectorHaloItem, PropertiesHaloItem, WorkflowHaloItem, DeleteHaloItem);
        if (!this.element.definition.isDiscretionary) {
            this.addItems(EntryCriterionHaloItem, ReactivateCriterionHaloItem, ExitCriterionHaloItem);
        }
        if (this.element.definition.implementationRef) {
            const model = task.definition.implementationModel && task.definition.implementationModel.taskModel;
            const taskModel = model && model.taskModel || '';
            try {
                JSON.parse(taskModel);
                this.addItems(ZoomTaskImplementationHaloItem, InputParametersHaloItem, OutputParametersHaloItem, PreviewTaskFormHaloItem);                
            } catch (error) {
                this.addItems(ZoomTaskImplementationHaloItem, InputParametersHaloItem, OutputParametersHaloItem, InvalidPreviewTaskFormHaloItem);
            }
        } else {
            this.addItems(NewTaskImplemenationHaloItem);
        }
    }    
}
