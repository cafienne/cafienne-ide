import HaloClickItem from "../../../../../../../editors/modelcanvas/halo/haloclickitem";
import Images from "../../../../../../../util/images/images";
import CasePlanHalo from "../../caseplanhalo";

export default class TestHaloItem extends HaloClickItem<CasePlanHalo> {
    constructor(halo: CasePlanHalo) {
        super(halo, Images.Test, 'Test cases of this type', e => this.halo.element.canvas.testRunner.show());
    }
}
