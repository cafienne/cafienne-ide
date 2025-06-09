import Images from "../../../../../../../util/images/images";
import HaloClickItem from "../../../haloclickitem";
import HumanTaskHalo from "../../humantaskhalo";

export default class WorkflowHaloItem extends HaloClickItem {
    static defaultBar(halo: HumanTaskHalo) {
        return halo.leftBar;
    }

    constructor(halo: HumanTaskHalo) {
        super(halo, Images.BlockingHumanTaskHalo, 'Open workflow properties', e => halo.element.showWorkflowProperties());
    }
}
