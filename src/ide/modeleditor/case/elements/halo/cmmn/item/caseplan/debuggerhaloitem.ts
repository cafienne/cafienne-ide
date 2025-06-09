import Images from "../../../../../../../util/images/images";
import HaloClickItem from "../../../haloclickitem";
import CasePlanHalo from "../../caseplanhalo";

export default class DebuggerHaloItem extends HaloClickItem {
    constructor(halo: CasePlanHalo) {
        super(halo, Images.Debug, 'Debug cases of this type', e => this.halo.element.case.debugEditor.show());
    }
}
