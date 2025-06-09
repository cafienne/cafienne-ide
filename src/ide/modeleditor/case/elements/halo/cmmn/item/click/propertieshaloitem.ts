import Images from "../../../../../../../util/images/images";
import Halo from "../../../halo";
import HaloClickItem from "../../../haloclickitem";

export default class PropertiesHaloItem extends HaloClickItem {
    constructor(halo: Halo) {
        super(halo, Images.Settings, 'Open properties of the ' + halo.element.typeDescription, e => halo.element.propertiesView.show(true), halo.leftBar);
    }
}
