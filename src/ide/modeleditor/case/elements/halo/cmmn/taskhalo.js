import TaskView from "../../taskview";
import InputParametersHaloItem from "./item/click/inputparametershaloitem";
import NewTaskImplementationHaloItem from "./item/click/newtaskimplementationhaloitem";
import OutputParametersHaloItem from "./item/click/outputparametershaloitem";
import ZoomTaskImplementationHaloItem from "./item/click/zoomtaskimplementationhaloitem";
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
            this.addItems(NewTaskImplementationHaloItem);
        }
    }
}
