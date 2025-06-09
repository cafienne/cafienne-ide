import Images from "../../../../../../../util/images/images";
import Halo from "../../../halo";
import HaloClickItem from "../../../haloclickitem";

export default class CaseRolesHaloItem extends HaloClickItem {
    constructor(halo: Halo) {
        super(halo, Images.Roles, 'Edit case team', e => this.halo.element.case.teamEditor.show());
    }
}
