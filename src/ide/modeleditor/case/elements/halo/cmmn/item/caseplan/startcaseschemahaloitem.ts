import Images from "../../../../../../../util/images/images";
import HaloClickItem from "../../../haloclickitem";
import CasePlanHalo from "../../caseplanhalo";

export default class StartCaseSchemaHaloItem extends HaloClickItem {
    constructor(halo: CasePlanHalo) {
        super(halo, Images.StartCaseSchema, 'Edit start case schema', e => this.halo.element.case.startCaseEditor.show());
    }
}
