import ExitCriterionView from "../../../../exitcriterionview";
import Halo from "../../../halo";
import SentryHaloItem from "./sentryhaloitem";

export default class ExitCriterionHaloItem extends SentryHaloItem {
    constructor(halo: Halo) {
        super(halo, ExitCriterionView);
    }
}
