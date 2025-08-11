import HaloClickItem from "../../../../../../../editors/modelcanvas/halo/haloclickitem";
import Images from "../../../../../../../util/images/images";
import TaskHalo from "../../taskhalo";

export default class NewTaskImplementationHaloItem extends HaloClickItem {
    constructor(halo: TaskHalo) {
        super(halo, Images.NewModel, 'Create a new implementation for the task', e => halo.element.generateNewTaskImplementation(), halo.leftBar);
    }
}
