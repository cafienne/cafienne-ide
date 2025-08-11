import $ from "jquery";
import Halo from "../../../../../../../editors/modelcanvas/halo/halo";
import HaloItem from "../../../../../../../editors/modelcanvas/halo/haloitem";

export default class SeparatorHaloItem extends HaloItem {
    /**
     * Create an empty halo item.
     */
    constructor(halo: Halo) {
        super(halo, '', '', halo.topBar, $('<div style="width:12px;height:21px" />'));
    }
}
