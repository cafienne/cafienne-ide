import Images from "../../../../../../../util/images/images";
import HaloClickItem from "../../../haloclickitem";
import HumanTaskHalo from "../../humantaskhalo";

export default class PreviewTaskFormHaloItem extends HaloClickItem {
    constructor(halo: HumanTaskHalo) {
        super(halo, Images.Preview, 'Preview Task Form', e => halo.element.previewTaskForm(), halo.bottomBar);
    }
}
