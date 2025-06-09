import EntryCriterionView from "../../../../entrycriterionview";
import Halo from "../../../halo";
import SentryHaloItem from "./sentryhaloitem";

export default class EntryCriterionHaloItem extends SentryHaloItem {
    constructor(halo: Halo) {
        super(halo, EntryCriterionView);
    }
}
