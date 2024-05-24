import PlanningTableView from "../planningtableview";
import Halo from "./halo";
import { DeleteHaloItem, PropertiesHaloItem } from "./item/haloclickitems";

export default class PlanningTableHalo extends Halo {
    /**
     * Create the halo for the planning table.
     * @param {PlanningTableView} element 
     */
    constructor(element) {
        super(element);
        this.element = element;
    }

    /**
     * Fills the halo in the resizer; event for filling the halo
     */
    createItems() {
        this.topBar.addItems(PropertiesHaloItem, DeleteHaloItem);
    }
}
