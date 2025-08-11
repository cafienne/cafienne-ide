import ReactivateCriterionDefinition from "../../../../../../repository/definition/cmmn/sentry/reactivatecriteriondefinition";
import ConnectorHaloItem from "../../../../../editors/modelcanvas/halo/connectorhaloitem";
import DeleteHaloItem from "../../../../../editors/modelcanvas/halo/deletehaloitem";
import PropertiesHaloItem from "../../../../../editors/modelcanvas/halo/propertieshaloitem";
import ReactivateCriterionView from "../../reactivatecriterionview";
import CaseHalo from "../casehalo";

export default class ReactivateCriterionHalo extends CaseHalo<ReactivateCriterionDefinition, ReactivateCriterionView> {

    createItems() {
        this.topBar.addItems(ConnectorHaloItem);

        this.addItems(PropertiesHaloItem, DeleteHaloItem);
    }
}
