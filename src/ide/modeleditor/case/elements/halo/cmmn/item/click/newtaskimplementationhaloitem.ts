import Images from "../../../../../../../util/images/images";
import HaloClickItem from "../../../haloclickitem";
import TaskHalo from "../../taskhalo";

export default class NewTaskImplementationHaloItem extends HaloClickItem {
    constructor(halo: TaskHalo) {
        super(halo, Images.NewModel, 'Create a new implementation for the task', e => halo.element.generateNewTaskImplementation(), halo.leftBar);
    }
}
