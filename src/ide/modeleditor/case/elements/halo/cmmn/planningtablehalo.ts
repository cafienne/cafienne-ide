import PlanningTableDefinition from "../../../../../../repository/definition/cmmn/caseplan/planning/planningtabledefinition";
import DeleteHaloItem from "../../../../../editors/modelcanvas/halo/deletehaloitem";
import Halo from "../../../../../editors/modelcanvas/halo/halo";
import PropertiesHaloItem from "../../../../../editors/modelcanvas/halo/propertieshaloitem";
import PlanningTableView from "../../planningtableview";

export default class PlanningTableHalo extends Halo<PlanningTableDefinition, PlanningTableView> {
    /**
     * Fills the halo in the resizer; event for filling the halo
     */
    createItems() {
        this.topBar.addItems(PropertiesHaloItem, DeleteHaloItem);
    }
}
