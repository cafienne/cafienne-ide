import Images from "../../../../../../../util/images/images";
import HaloClickItem from "../../../haloclickitem";
import TaskHalo from "../../taskhalo";

export default class OutputParametersHaloItem extends HaloClickItem {
    static defaultBar(halo: TaskHalo) {
        return halo.bottomBar;
    }

    constructor(halo: TaskHalo) {
        super(halo, Images.TaskOutput, 'Open output parameter mappings of the ' + halo.element.typeDescription, e => halo.element.showMappingsEditor());
    }
}
