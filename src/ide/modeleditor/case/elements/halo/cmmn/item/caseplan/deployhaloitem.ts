import Images from "../../../../../../../util/images/images";
import HaloClickItem from "../../../haloclickitem";
import CasePlanHalo from "../../caseplanhalo";

export default class DeployHaloItem extends HaloClickItem {
    constructor(halo: CasePlanHalo) {
        super(halo, Images.Deploy, 'Deploy this case', e => this.halo.element.case.deployForm.show());
    }
}
