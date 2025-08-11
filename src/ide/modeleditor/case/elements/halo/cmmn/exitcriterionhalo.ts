import ExitCriterionDefinition from "../../../../../../repository/definition/cmmn/sentry/exitcriteriondefinition";
import ConnectorHaloItem from "../../../../../editors/modelcanvas/halo/connectorhaloitem";
import DeleteHaloItem from "../../../../../editors/modelcanvas/halo/deletehaloitem";
import Halo from "../../../../../editors/modelcanvas/halo/halo";
import PropertiesHaloItem from "../../../../../editors/modelcanvas/halo/propertieshaloitem";
import ExitCriterionView from "../../exitcriterionview";
import EntryCriterionHaloItem from "./item/drag/entrycriterionhaloitem";

export default class ExitCriterionHalo extends Halo<ExitCriterionDefinition, ExitCriterionView> {
    /**
     * Sets the halo images in the resizer
     */
    createItems() {
        this.addItems(ConnectorHaloItem, EntryCriterionHaloItem, PropertiesHaloItem, DeleteHaloItem);
    }
}
