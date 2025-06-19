import { ReactivateCriterionView } from "../../../../sentryview";
import SentryHaloItem from "./sentryhaloitem";

export default class ReactivateCriterionHaloItem extends SentryHaloItem {
    constructor(halo) {
        super(halo, ReactivateCriterionView.smallImage, ReactivateCriterionView.typeDescription);
    }

    get haloType() {
        return ReactivateCriterionView;
    }
}
