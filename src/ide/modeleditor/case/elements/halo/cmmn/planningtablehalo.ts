import PlanningTableDefinition from "../../../../../../repository/definition/cmmn/caseplan/planning/planningtabledefinition";
import DeleteHaloItem from "../../../../../editors/modelcanvas/halo/deletehaloitem";
import PropertiesHaloItem from "../../../../../editors/modelcanvas/halo/propertieshaloitem";
import PlanningTableView from "../../planningtableview";
import CaseHalo from "../casehalo";

export default class PlanningTableHalo extends CaseHalo<PlanningTableDefinition, PlanningTableView> {

    createItems() {
        this.topBar.addItems(PropertiesHaloItem, DeleteHaloItem);
    }
}
