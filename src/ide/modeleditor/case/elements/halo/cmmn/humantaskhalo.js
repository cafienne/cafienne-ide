import DeleteHaloItem from "./item/click/deletehaloitem";
import InputParametersHaloItem from "./item/click/inputparametershaloitem";
import InvalidPreviewTaskFormHaloItem from "./item/click/invalidpreviewtaskformhaloitem";
import NewTaskImplementationHaloItem from "./item/click/newtaskimplementationhaloitem";
import OutputParametersHaloItem from "./item/click/outputparametershaloitem";
import PreviewTaskFormHaloItem from "./item/click/previewtaskformhaloitem";
import PropertiesHaloItem from "./item/click/propertieshaloitem";
import WorkflowHaloItem from "./item/click/workflowhaloitem";
import ZoomTaskImplementationHaloItem from "./item/click/zoomtaskimplementationhaloitem";
import ConnectorHaloItem from "./item/drag/connectorhaloitem";
import EntryCriterionHaloItem from "./item/drag/entrycriterionhaloitem";
import ExitCriterionHaloItem from "./item/drag/exitcriterionhaloitem";
import ReactivateCriterionHaloItem from "./item/drag/reactivatecriterionhaloitem";
import TaskHalo from "./taskhalo";

export default class HumanTaskHalo extends TaskHalo {
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
            this.addItems(NewTaskImplementationHaloItem);
        }
    }
}
