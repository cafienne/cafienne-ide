import ExitCriterionDefinition from "../../../../../../repository/definition/cmmn/sentry/exitcriteriondefinition";
import ExitCriterionView from "../../exitcriterionview";
import Halo from "../halo";
import DeleteHaloItem from "./item/click/deletehaloitem";
import PropertiesHaloItem from "./item/click/propertieshaloitem";
import ConnectorHaloItem from "./item/drag/connectorhaloitem";
import EntryCriterionHaloItem from "./item/drag/entrycriterionhaloitem";

export default class ExitCriterionHalo extends Halo<ExitCriterionDefinition, ExitCriterionView> {
    /**
     * Sets the halo images in the resizer
     */
    createItems() {
        this.addItems(ConnectorHaloItem, EntryCriterionHaloItem, PropertiesHaloItem, DeleteHaloItem);
    }
}
