import Images from "../../../../../../../util/images/images";
import HaloClickItem from "../../../haloclickitem";

export default class ViewSourceHaloItem extends HaloClickItem {
    constructor(halo) {
        super(halo, Images.ViewSource, 'View source of this case', e => this.halo.element.case.viewSource());
    }
}
