import HaloClickItem from "../../../../../../../editors/modelcanvas/halo/haloclickitem";
import Images from "../../../../../../../util/images/images";
import CaseHalo from "../../../casehalo";

export default class DeployHaloItem extends HaloClickItem<CaseHalo> {
    constructor(halo: CaseHalo) {
        super(halo, Images.Deploy, 'Deploy this case', e => this.halo.element.canvas.deployForm.show());
    }
}
