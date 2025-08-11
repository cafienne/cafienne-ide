import HumanTaskDefinition from "../../../../../../repository/definition/cmmn/caseplan/task/humantaskdefinition";
import ConnectorHaloItem from "../../../../../editors/modelcanvas/halo/connectorhaloitem";
import DeleteHaloItem from "../../../../../editors/modelcanvas/halo/deletehaloitem";
import PropertiesHaloItem from "../../../../../editors/modelcanvas/halo/propertieshaloitem";
import HumanTaskView from "../../humantaskview";
import InputParametersHaloItem from "./item/click/inputparametershaloitem";
import InvalidPreviewTaskFormHaloItem from "./item/click/invalidpreviewtaskformhaloitem";
import NewTaskImplementationHaloItem from "./item/click/newtaskimplementationhaloitem";
import OutputParametersHaloItem from "./item/click/outputparametershaloitem";
import PreviewTaskFormHaloItem from "./item/click/previewtaskformhaloitem";
import WorkflowHaloItem from "./item/click/workflowhaloitem";
import ZoomTaskImplementationHaloItem from "./item/click/zoomtaskimplementationhaloitem";
import EntryCriterionHaloItem from "./item/drag/entrycriterionhaloitem";
import ExitCriterionHaloItem from "./item/drag/exitcriterionhaloitem";
import ReactivateCriterionHaloItem from "./item/drag/reactivatecriterionhaloitem";
import TaskHalo from "./taskhalo";

export default class HumanTaskHalo extends TaskHalo<HumanTaskDefinition, HumanTaskView> {
    /**
     * Create the halo for the task.
     */
    createItems() {
        const task = this.element;
        this.addItems(ConnectorHaloItem, PropertiesHaloItem, WorkflowHaloItem, DeleteHaloItem);
        if (!this.element.definition.isDiscretionary) {
            this.addItems(EntryCriterionHaloItem, ReactivateCriterionHaloItem, ExitCriterionHaloItem);
        }
        if (this.element.definition.implementationRef) {

            const model = task.definition.workflow.humanTaskRef.getDefinition()?.taskModel;
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
