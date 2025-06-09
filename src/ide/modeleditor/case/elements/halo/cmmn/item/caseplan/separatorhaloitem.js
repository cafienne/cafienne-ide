import $ from "jquery";
import HaloItem from "../../../haloitem";

export default class SeparatorHaloItem extends HaloItem {
    /**
     * Create an empty halo item.
     * @param {Halo} halo
     */
    constructor(halo) {
        super(halo, '', '', $('<div style="width:12px;height:21px" />'));
    }
}
