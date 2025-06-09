import EntryCriterionView from "../../../../entrycriterionview";
import SentryHaloItem from "./sentryhaloitem";

export default class EntryCriterionHaloItem extends SentryHaloItem {
    constructor(halo) {
        super(halo, EntryCriterionView.smallImage, EntryCriterionView.typeDescription);
    }

    get haloType() {
        return EntryCriterionView;
    }
}
