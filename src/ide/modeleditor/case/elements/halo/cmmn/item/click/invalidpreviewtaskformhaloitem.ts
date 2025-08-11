import HaloClickItem from "../../../../../../../editors/modelcanvas/halo/haloclickitem";
import Images from "../../../../../../../util/images/images";
import HumanTaskHalo from "../../humantaskhalo";

export default class InvalidPreviewTaskFormHaloItem extends HaloClickItem {
    constructor(halo: HumanTaskHalo) {
        super(halo, Images.Preview, 'Task Preview not available', e => { }, halo.bottomBar);
        // this.html.css('background-color', 'red');
        this.html.css('border', '2px solid red');
    }
}
