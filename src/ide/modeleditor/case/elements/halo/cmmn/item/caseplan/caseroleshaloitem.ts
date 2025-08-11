import HaloClickItem from "../../../../../../../editors/modelcanvas/halo/haloclickitem";
import Images from "../../../../../../../util/images/images";
import CaseHalo from "../../../casehalo";

export default class CaseRolesHaloItem extends HaloClickItem<CaseHalo> {
    constructor(halo: CaseHalo) {
        super(halo, Images.Roles, 'Edit case team', e => this.halo.element.case.teamEditor.show());
    }
}
