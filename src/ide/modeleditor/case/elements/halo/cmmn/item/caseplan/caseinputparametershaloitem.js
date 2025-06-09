import Images from "../../../../../../../util/images/images";
import HaloClickItem from "../../../haloclickitem";

export default class CaseInputParametersHaloItem extends HaloClickItem {
    constructor(halo) {
        super(halo, Images.Input, 'Edit case input parameters', e => this.halo.element.case.caseParametersEditor.show());
    }
}
