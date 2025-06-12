import Images from "../../../../../../../util/images/images";
import Halo from "../../../halo";
import HaloClickItem from "../../../haloclickitem";

export default class DeployHaloItem extends HaloClickItem {
    constructor(halo: Halo) {
        super(halo, Images.Deploy, 'Deploy this case', e => this.halo.element.case.deployForm.show());
    }
}
