import Images from "../../../../../../../util/images/images";
import Halo from "../../../halo";
import HaloClickItem from "../../../haloclickitem";

export default class TestHaloItem extends HaloClickItem {
    constructor(halo: Halo) {
        super(halo, Images.Test, 'Test cases of this type', e => this.halo.element.case.testRunner.show());
    }
}
