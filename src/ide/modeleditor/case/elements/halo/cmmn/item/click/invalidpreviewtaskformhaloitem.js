import Images from "../../../../../../../util/images/images";
import HaloClickItem from "../../../haloclickitem";

export default class InvalidPreviewTaskFormHaloItem extends HaloClickItem {
    /**
     * Returns the default bar in which this item appears
     * @param {Halo} halo
     */
    static defaultBar(halo) {
        return halo.bottomBar;
    }

    constructor(halo) {
        super(halo, Images.Preview, 'Task Preview not available', e => { });
        // this.html.css('background-color', 'red');
        this.html.css('border', '2px solid red');
    }
}
