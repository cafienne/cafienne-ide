import PlanningTableDefinition from "../../../../../../repository/definition/cmmn/caseplan/planning/planningtabledefinition";
import PlanningTableView from "../../planningtableview";
import Halo from "../halo";
import DeleteHaloItem from "./item/click/deletehaloitem";
import PropertiesHaloItem from "./item/click/propertieshaloitem";

export default class PlanningTableHalo extends Halo<PlanningTableDefinition, PlanningTableView> {
    /**
     * Fills the halo in the resizer; event for filling the halo
     */
    createItems() {
        this.topBar.addItems(PropertiesHaloItem, DeleteHaloItem);
    }
}
