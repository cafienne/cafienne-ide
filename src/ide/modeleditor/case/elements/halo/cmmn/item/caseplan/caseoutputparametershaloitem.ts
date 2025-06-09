import Images from "../../../../../../../util/images/images";
import HaloClickItem from "../../../haloclickitem";
import CasePlanHalo from "../../caseplanhalo";

export default class CaseOutputParametersHaloItem extends HaloClickItem {
    constructor(halo: CasePlanHalo) {
        super(halo, Images.Output, 'Edit case output parameters', e => this.halo.element.case.caseParametersEditor.show());
    }
}
