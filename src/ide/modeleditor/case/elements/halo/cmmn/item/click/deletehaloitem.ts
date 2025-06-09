import Images from "../../../../../../../util/images/images";
import Halo from "../../../halo";
import HaloClickItem from "../../../haloclickitem";

export default class DeleteHaloItem extends HaloClickItem {
    static defaultBar(halo: Halo) {
        return halo.leftBar;
    }

    constructor(halo: Halo) {
        super(halo, Images.DeleteBig, 'Delete the ' + halo.element.typeDescription, e => halo.element.case.__removeElement(halo.element));
    }
}
