import Images from "../../../../../../../util/images/images";
import HaloClickItem from "../../../haloclickitem";
import CasePlanHalo from "../../caseplanhalo";

export default class CaseRolesHaloItem extends HaloClickItem {
    constructor(halo: CasePlanHalo) {
        super(halo, Images.Roles, 'Edit case team', e => this.halo.element.case.teamEditor.show());
    }
}
