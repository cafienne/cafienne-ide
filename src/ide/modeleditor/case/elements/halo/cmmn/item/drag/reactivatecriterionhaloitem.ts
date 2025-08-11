import ReactivateCriterionView from "../../../../reactivatecriterionview";
import CaseHalo from "../../../casehalo";
import SentryHaloItem from "./sentryhaloitem";

export default class ReactivateCriterionHaloItem extends SentryHaloItem {
    constructor(halo: CaseHalo) {
        super(halo, ReactivateCriterionView);
    }
}
