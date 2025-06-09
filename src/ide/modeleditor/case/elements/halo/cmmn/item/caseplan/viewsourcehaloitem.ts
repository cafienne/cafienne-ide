import Images from "../../../../../../../util/images/images";
import HaloClickItem from "../../../haloclickitem";
import CasePlanHalo from "../../caseplanhalo";

export default class ViewSourceHaloItem extends HaloClickItem {
    constructor(halo: CasePlanHalo) {
        super(halo, Images.ViewSource, 'View source of this case', e => this.halo.element.case.viewSource());
    }
}
