import HaloClickItem from "../../../../../../../editors/modelcanvas/halo/haloclickitem";
import Images from "../../../../../../../util/images/images";
import HumanTaskHalo from "../../humantaskhalo";

export default class WorkflowHaloItem extends HaloClickItem {
    constructor(halo: HumanTaskHalo) {
        super(halo, Images.BlockingHumanTaskHalo, 'Open workflow properties', e => halo.element.showWorkflowProperties(), halo.leftBar);
    }
}
