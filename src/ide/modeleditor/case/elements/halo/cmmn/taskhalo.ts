import TaskDefinition from "../../../../../../repository/definition/cmmn/caseplan/task/taskdefinition";
import TaskView from "../../taskview";
import InputParametersHaloItem from "./item/click/inputparametershaloitem";
import NewTaskImplementationHaloItem from "./item/click/newtaskimplementationhaloitem";
import OutputParametersHaloItem from "./item/click/outputparametershaloitem";
import ZoomTaskImplementationHaloItem from "./item/click/zoomtaskimplementationhaloitem";
import PlanItemHalo from "./planitemhalo";

export default class TaskHalo<TD extends TaskDefinition = TaskDefinition, TV extends TaskView = TaskView> extends PlanItemHalo<TD, TV> {
    createItems() {
        super.createItems();
        if (this.element.definition.implementationRef) {
            this.addItems(ZoomTaskImplementationHaloItem, InputParametersHaloItem, OutputParametersHaloItem);
        } else {
            this.addItems(NewTaskImplementationHaloItem);
        }
    }
}
