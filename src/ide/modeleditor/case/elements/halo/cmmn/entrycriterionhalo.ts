import EntryCriterionDefinition from "../../../../../../repository/definition/cmmn/sentry/entrycriteriondefinition";
import EntryCriterionView from "../../entrycriterionview";
import Halo from "../halo";
import DeleteHaloItem from "./item/click/deletehaloitem";
import PropertiesHaloItem from "./item/click/propertieshaloitem";
import ConnectorHaloItem from "./item/drag/connectorhaloitem";
import ExitCriterionHaloItem from "./item/drag/exitcriterionhaloitem";

export default class EntryCriterionHalo extends Halo<EntryCriterionDefinition, EntryCriterionView> {
    /**
     * Sets the halo images in the resizer
     */
    createItems() {
        this.addItems(ConnectorHaloItem, ExitCriterionHaloItem, PropertiesHaloItem, DeleteHaloItem);
    }
}
