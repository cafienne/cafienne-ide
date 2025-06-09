import ReactivateCriterionDefinition from "../../../../../../repository/definition/cmmn/sentry/reactivatecriteriondefinition";
import ReactivateCriterionView from "../../reactivatecriterionview";
import Halo from "../halo";
import DeleteHaloItem from "./item/click/deletehaloitem";
import PropertiesHaloItem from "./item/click/propertieshaloitem";
import ConnectorHaloItem from "./item/drag/connectorhaloitem";

export default class ReactivateCriterionHalo extends Halo<ReactivateCriterionDefinition, ReactivateCriterionView> {
    /**
     * Sets the halo images in the resizer
     */
    createItems() {
        this.addItems(ConnectorHaloItem, PropertiesHaloItem, DeleteHaloItem);
    }
}
