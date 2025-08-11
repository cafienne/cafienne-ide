import ExitCriterionDefinition from "../../../../../../repository/definition/cmmn/sentry/exitcriteriondefinition";
import ConnectorHaloItem from "../../../../../editors/modelcanvas/halo/connectorhaloitem";
import DeleteHaloItem from "../../../../../editors/modelcanvas/halo/deletehaloitem";
import PropertiesHaloItem from "../../../../../editors/modelcanvas/halo/propertieshaloitem";
import ExitCriterionView from "../../exitcriterionview";
import CaseHalo from "../casehalo";
import EntryCriterionHaloItem from "./item/drag/entrycriterionhaloitem";

export default class ExitCriterionHalo extends CaseHalo<ExitCriterionDefinition, ExitCriterionView> {

    createItems() {
        this.topBar.addItems(ConnectorHaloItem);
        this.addItems(EntryCriterionHaloItem, PropertiesHaloItem, DeleteHaloItem);
    }
}
