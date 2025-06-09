import Images from "../../../../../../../util/images/images";
import HaloClickItem from "../../../haloclickitem";
import TaskHalo from "../../taskhalo";

export default class NewTaskImplementationHaloItem extends HaloClickItem {
    static defaultBar(halo: TaskHalo) {
        return halo.leftBar;
    }

    constructor(halo: TaskHalo) {
        super(halo, Images.NewModel, 'Create a new implementation for the task', e => halo.element.generateNewTaskImplementation());
    }
}
