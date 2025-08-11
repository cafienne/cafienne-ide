import EntryCriterionDefinition from "../../../../../../repository/definition/cmmn/sentry/entrycriteriondefinition";
import ConnectorHaloItem from "../../../../../editors/modelcanvas/halo/connectorhaloitem";
import DeleteHaloItem from "../../../../../editors/modelcanvas/halo/deletehaloitem";
import PropertiesHaloItem from "../../../../../editors/modelcanvas/halo/propertieshaloitem";
import EntryCriterionView from "../../entrycriterionview";
import CaseHalo from "../casehalo";
import ExitCriterionHaloItem from "./item/drag/exitcriterionhaloitem";

export default class EntryCriterionHalo extends CaseHalo<EntryCriterionDefinition, EntryCriterionView> {

    createItems() {
        this.topBar.addItems(ConnectorHaloItem);
        this.addItems(ExitCriterionHaloItem, PropertiesHaloItem, DeleteHaloItem);
    }
}
