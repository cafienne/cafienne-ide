import Images from "../../../../../../../util/images/images";
import HaloClickItem from "../../../haloclickitem";

export default class WorkflowHaloItem extends HaloClickItem {
    /**
     * Returns the default bar in which this item appears
     * @param {Halo} halo
     */
    static defaultBar(halo) {
        return halo.leftBar;
    }

    constructor(halo) {
        super(halo, Images.BlockingHumanTaskHalo, 'Open workflow properties', e => this.element.showWorkflowProperties());
    }
}
