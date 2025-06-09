import Images from "../../../../../../../util/images/images";
import HaloClickItem from "../../../haloclickitem";

export default class StartCaseSchemaHaloItem extends HaloClickItem {
    constructor(halo) {
        super(halo, Images.StartCaseSchema, 'Edit start case schema', e => this.halo.element.case.startCaseEditor.show());
    }
}
