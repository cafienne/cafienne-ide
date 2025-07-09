import $ from "jquery";
import Halo from "../../../halo";
import HaloItem from "../../../haloitem";

export default class SeparatorHaloItem extends HaloItem {
    /**
     * Create an empty halo item.
     */
    constructor(halo: Halo) {
        super(halo, '', '', halo.topBar, $('<div style="width:12px;height:21px"></div>'));
    }
}
