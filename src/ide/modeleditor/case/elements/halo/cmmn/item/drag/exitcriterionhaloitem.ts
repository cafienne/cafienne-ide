import ExitCriterionView from "../../../../exitcriterionview";
import CaseHalo from "../../../casehalo";
import SentryHaloItem from "./sentryhaloitem";

export default class ExitCriterionHaloItem extends SentryHaloItem {
    constructor(halo: CaseHalo) {
        super(halo, ExitCriterionView);
    }
}
