import ReactivateCriterionView from "../../../../reactivatecriterionview";
import Halo from "../../../halo";
import SentryHaloItem from "./sentryhaloitem";

export default class ReactivateCriterionHaloItem extends SentryHaloItem {
    constructor(halo: Halo) {
        super(halo, ReactivateCriterionView);
    }
}