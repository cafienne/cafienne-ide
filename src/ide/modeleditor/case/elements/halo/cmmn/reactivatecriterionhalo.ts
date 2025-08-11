import ReactivateCriterionDefinition from "../../../../../../repository/definition/cmmn/sentry/reactivatecriteriondefinition";
import ConnectorHaloItem from "../../../../../editors/modelcanvas/halo/connectorhaloitem";
import DeleteHaloItem from "../../../../../editors/modelcanvas/halo/deletehaloitem";
import Halo from "../../../../../editors/modelcanvas/halo/halo";
import PropertiesHaloItem from "../../../../../editors/modelcanvas/halo/propertieshaloitem";
import ReactivateCriterionView from "../../reactivatecriterionview";

export default class ReactivateCriterionHalo extends Halo<ReactivateCriterionDefinition, ReactivateCriterionView> {
    /**
     * Sets the halo images in the resizer
     */
    createItems() {
        this.addItems(ConnectorHaloItem, PropertiesHaloItem, DeleteHaloItem);
    }
}
