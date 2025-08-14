import HaloClickItem from "../../../../../../../editors/modelcanvas/halo/haloclickitem";
import Images from "../../../../../../../util/images/images";
import CaseHalo from "../../../casehalo";

export default class DebuggerHaloItem extends HaloClickItem<CaseHalo> {
    constructor(halo: CaseHalo) {
        super(halo, Images.Debug, 'Debug cases of this type', e => this.halo.element.canvas.debugEditor.show());
    }
}
