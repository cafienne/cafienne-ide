import ExitCriterionView from "../../../../exitcriterionview";
import SentryHaloItem from "./sentryhaloitem";

export default class ExitCriterionHaloItem extends SentryHaloItem {
    constructor(halo) {
        super(halo, ExitCriterionView.smallImage, ExitCriterionView.typeDescription);
    }

    get haloType() {
        return ExitCriterionView;
    }
}
