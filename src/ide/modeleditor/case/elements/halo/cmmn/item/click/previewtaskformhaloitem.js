import Images from "../../../../../../../util/images/images";
import HaloClickItem from "../../../haloclickitem";

export default class PreviewTaskFormHaloItem extends HaloClickItem {
    /**
     * Returns the default bar in which this item appears
     * @param {Halo} halo
     */
    static defaultBar(halo) {
        return halo.bottomBar;
    }

    constructor(halo) {
        super(halo, Images.Preview, 'Preview Task Form', e => this.element.previewTaskForm());
    }
}
