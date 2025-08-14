import HaloClickItem from "../../../../../../../editors/modelcanvas/halo/haloclickitem";
import Images from "../../../../../../../util/images/images";
import CaseHalo from "../../../casehalo";

export default class CaseOutputParametersHaloItem extends HaloClickItem<CaseHalo> {
    constructor(halo: CaseHalo) {
        super(halo, Images.Output, 'Edit case output parameters', e => this.halo.element.canvas.caseParametersEditor.show());
    }
}
