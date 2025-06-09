import Images from "../../../../../../../util/images/images";
import Halo from "../../../halo";
import HaloClickItem from "../../../haloclickitem";

export default class DebuggerHaloItem extends HaloClickItem {
    constructor(halo: Halo) {
        super(halo, Images.Debug, 'Debug cases of this type', e => this.halo.element.case.debugEditor.show());
    }
}
