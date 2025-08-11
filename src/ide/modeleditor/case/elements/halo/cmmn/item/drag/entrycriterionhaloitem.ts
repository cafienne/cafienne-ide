import EntryCriterionView from "../../../../entrycriterionview";
import CaseHalo from "../../../casehalo";
import SentryHaloItem from "./sentryhaloitem";

export default class EntryCriterionHaloItem extends SentryHaloItem {
    constructor(halo: CaseHalo) {
        super(halo, EntryCriterionView);
    }
}
