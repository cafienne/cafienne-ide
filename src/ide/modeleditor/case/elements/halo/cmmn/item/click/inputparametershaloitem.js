import Images from "../../../../../../../util/images/images";
import HaloClickItem from "../../../haloclickitem";


export default class InputParametersHaloItem extends HaloClickItem {
    /**
     * Returns the default bar in which this item appears
     * @param {Halo} halo
     */
    static defaultBar(halo) {
        return halo.bottomBar;
    }

    constructor(halo) {
        super(halo, Images.TaskInput, 'Open input parameter mappings of the ' + halo.element.typeDescription, e => this.element.showMappingsEditor());
    }
}
