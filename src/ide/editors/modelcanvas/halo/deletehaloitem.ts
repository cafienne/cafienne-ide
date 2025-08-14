import Images from "../../../util/images/images";
import Halo from "./halo";
import HaloClickItem from "./haloclickitem";

export default class DeleteHaloItem extends HaloClickItem {
    constructor(halo: Halo) {
        super(halo, Images.DeleteBig, 'Delete the ' + halo.element.typeDescription, e => halo.element.canvas.__removeElement(halo.element), halo.leftBar);
    }
}
