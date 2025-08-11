import CaseFileItemDef from "../../../../../../repository/definition/cmmn/casefile/casefileitemdef";
import ConnectorHaloItem from "../../../../../editors/modelcanvas/halo/connectorhaloitem";
import DeleteHaloItem from "../../../../../editors/modelcanvas/halo/deletehaloitem";
import PropertiesHaloItem from "../../../../../editors/modelcanvas/halo/propertieshaloitem";
import CaseFileItemView from "../../casefileitemview";
import CaseHalo from "../casehalo";
import EntryCriterionHaloItem from "./item/drag/entrycriterionhaloitem";
import ExitCriterionHaloItem from "./item/drag/exitcriterionhaloitem";
import ReactivateCriterionHaloItem from "./item/drag/reactivatecriterionhaloitem";

export default class CaseFileItemHalo extends CaseHalo<CaseFileItemDef, CaseFileItemView> {

    createItems() {
        this.addItems(ConnectorHaloItem, PropertiesHaloItem, DeleteHaloItem);
        if (!this.element.definition.isEmpty) {
            // Only show sentry options when a case file item is associated
            this.addItems(EntryCriterionHaloItem, ReactivateCriterionHaloItem, ExitCriterionHaloItem);
        }
    }
}
