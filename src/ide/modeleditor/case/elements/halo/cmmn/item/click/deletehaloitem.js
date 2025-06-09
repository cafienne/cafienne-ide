import Images from "../../../../../../../util/images/images";
import HaloClickItem from "../../../haloclickitem";

export default class DeleteHaloItem extends HaloClickItem {
    /**
     * Returns the default bar in which this item appears
     * @param {Halo} halo
     */
    static defaultBar(halo) {
        return halo.leftBar;
    }

    constructor(halo) {
        super(halo, Images.DeleteBig, 'Delete the ' + halo.element.typeDescription, e => this.element.case.__removeElement(this.element));
    }
}
