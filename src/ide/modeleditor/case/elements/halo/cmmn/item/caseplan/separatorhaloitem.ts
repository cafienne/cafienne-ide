import $ from "jquery";
import HaloItem from "../../../haloitem";
import CasePlanHalo from "../../caseplanhalo";

export default class SeparatorHaloItem extends HaloItem {
    /**
     * Create an empty halo item.
     */
    constructor(halo: CasePlanHalo) {
        super(halo, '', '', $('<div style="width:12px;height:21px" />'));
    }
}
