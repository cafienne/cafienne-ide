import Images from "../../../../../../../util/images/images";
import HaloClickItem from "../../../haloclickitem";
import HumanTaskHalo from "../../humantaskhalo";

export default class PreviewTaskFormHaloItem extends HaloClickItem {
    static defaultBar(halo: HumanTaskHalo) {
        return halo.bottomBar;
    }

    constructor(halo: HumanTaskHalo) {
        super(halo, Images.Preview, 'Preview Task Form', e => halo.element.previewTaskForm());
    }
}
