import HumanTaskDefinition from "../../../../../../repository/definition/cmmn/caseplan/task/humantaskdefinition";
import HaloItem from "../../../../../editors/modelcanvas/halo/haloitem";
import HumanTaskView from "../../humantaskview";
import InvalidPreviewTaskFormHaloItem from "./item/click/invalidpreviewtaskformhaloitem";
import PreviewTaskFormHaloItem from "./item/click/previewtaskformhaloitem";
import WorkflowHaloItem from "./item/click/workflowhaloitem";
import TaskHalo from "./taskhalo";

export default class HumanTaskHalo extends TaskHalo<HumanTaskDefinition, HumanTaskView> {

    createItems() {
        super.createItems();

        this.addItems(WorkflowHaloItem);
        if (this.element.definition.implementationRef) {
            const task = this.element;
            const model = task.definition.workflow.humanTaskRef.getDefinition()?.taskModel;
            const taskModel = model && model.taskModel || '';

            let previewItem: new (h: HumanTaskHalo) => HaloItem;
            try {
                JSON.parse(taskModel);
                previewItem = PreviewTaskFormHaloItem;
            } catch (error) {
                previewItem = InvalidPreviewTaskFormHaloItem;
            }

            this.addItems(previewItem);
        }
    }
}
