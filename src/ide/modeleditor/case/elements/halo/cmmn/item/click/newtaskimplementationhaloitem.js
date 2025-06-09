import Images from "../../../../../../../util/images/images";
import HaloClickItem from "../../../haloclickitem";

export default class NewTaskImplementationHaloItem extends HaloClickItem {
    /**
     * Returns the default bar in which this item appears
     * @param {Halo} halo
     */
    static defaultBar(halo) {
        return halo.leftBar;
    }

    constructor(halo) {
        super(halo, Images.NewModel, 'Create a new implementation for the task', e => this.element.generateNewTaskImplementation());
    }
}
