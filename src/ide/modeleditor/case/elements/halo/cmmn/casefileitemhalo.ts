import CaseFileItemDef from "../../../../../../repository/definition/cmmn/casefile/casefileitemdef";
import CaseFileItemView from "../../casefileitemview";
import Halo from "../halo";
import DeleteHaloItem from "./item/click/deletehaloitem";
import PropertiesHaloItem from "./item/click/propertieshaloitem";
import ConnectorHaloItem from "./item/drag/connectorhaloitem";
import EntryCriterionHaloItem from "./item/drag/entrycriterionhaloitem";
import ExitCriterionHaloItem from "./item/drag/exitcriterionhaloitem";
import ReactivateCriterionHaloItem from "./item/drag/reactivatecriterionhaloitem";

export default class CaseFileItemHalo extends Halo<CaseFileItemDef, CaseFileItemView> {
    createItems() {
        this.addItems(ConnectorHaloItem, PropertiesHaloItem, DeleteHaloItem);
        if (!this.element.definition.isEmpty) {
            // Only show sentry options when a case file item is associated
            this.addItems(EntryCriterionHaloItem, ReactivateCriterionHaloItem, ExitCriterionHaloItem);
        }
    }
}
