import Images from "../../../../../../../util/images/images";
import Halo from "../../../halo";
import HaloClickItem from "../../../haloclickitem";

export default class CaseInputParametersHaloItem extends HaloClickItem {
    constructor(halo: Halo) {
        super(halo, Images.Input, 'Edit case input parameters', e => this.halo.element.case.caseParametersEditor.show());
    }
}
