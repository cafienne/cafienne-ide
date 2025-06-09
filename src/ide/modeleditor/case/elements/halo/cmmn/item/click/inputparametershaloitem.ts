import Images from "../../../../../../../util/images/images";
import HaloClickItem from "../../../haloclickitem";
import TaskHalo from "../../taskhalo";

export default class InputParametersHaloItem extends HaloClickItem<TaskHalo> {
    constructor(halo: TaskHalo) {
        super(halo, Images.TaskInput, 'Open input parameter mappings of the ' + halo.element.typeDescription, e => halo.element.showMappingsEditor(), halo.bottomBar);
    }
}
