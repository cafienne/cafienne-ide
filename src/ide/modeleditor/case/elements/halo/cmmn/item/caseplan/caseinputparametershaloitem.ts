import Images from "../../../../../../../util/images/images";
import HaloClickItem from "../../../haloclickitem";
import CasePlanHalo from "../../caseplanhalo";

export default class CaseInputParametersHaloItem extends HaloClickItem {
    constructor(halo: CasePlanHalo) {
        super(halo, Images.Input, 'Edit case input parameters', e => this.halo.element.case.caseParametersEditor.show());
    }
}
