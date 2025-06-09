import Images from "../../../../../../../util/images/images";
import HaloClickItem from "../../../haloclickitem";

export default class CaseOutputParametersHaloItem extends HaloClickItem {
    constructor(halo) {
        super(halo, Images.Output, 'Edit case output parameters', e => this.halo.element.case.caseParametersEditor.show());
    }
}
