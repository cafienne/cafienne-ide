import Images from "../../../../../../../util/images/images";
import HaloClickItem from "../../../haloclickitem";
import HumanTaskHalo from "../../humantaskhalo";

export default class InvalidPreviewTaskFormHaloItem extends HaloClickItem {
    static defaultBar(halo: HumanTaskHalo) {
        return halo.bottomBar;
    }

    constructor(halo: HumanTaskHalo) {
        super(halo, Images.Preview, 'Task Preview not available', e => { });
        // this.html.css('background-color', 'red');
        this.html.css('border', '2px solid red');
    }
}
