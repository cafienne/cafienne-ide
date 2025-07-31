import Images from "../../../../../../../util/images/images";
import Halo from "../../../halo";
import HaloClickItem from "../../../haloclickitem";

export default class TrainingHaloItem extends HaloClickItem {
    constructor(halo: Halo) {
        super(halo, Images.AI, 'Train on case', e => this.halo.element.case.trainingForm.show());
    }
}
