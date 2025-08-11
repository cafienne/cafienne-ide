import EntryCriterionDefinition from "../../../../../../repository/definition/cmmn/sentry/entrycriteriondefinition";
import ConnectorHaloItem from "../../../../../editors/modelcanvas/halo/connectorhaloitem";
import DeleteHaloItem from "../../../../../editors/modelcanvas/halo/deletehaloitem";
import Halo from "../../../../../editors/modelcanvas/halo/halo";
import PropertiesHaloItem from "../../../../../editors/modelcanvas/halo/propertieshaloitem";
import EntryCriterionView from "../../entrycriterionview";
import ExitCriterionHaloItem from "./item/drag/exitcriterionhaloitem";

export default class EntryCriterionHalo extends Halo<EntryCriterionDefinition, EntryCriterionView> {
    /**
     * Sets the halo images in the resizer
     */
    createItems() {
        this.addItems(ConnectorHaloItem, ExitCriterionHaloItem, PropertiesHaloItem, DeleteHaloItem);
    }
}
