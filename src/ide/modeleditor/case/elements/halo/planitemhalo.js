import PlanItemView from "../planitemview";
import Halo from "./halo";
import { DeleteHaloItem, PropertiesHaloItem } from "./item/haloclickitems";
import { ConnectorHaloItem, EntryCriterionHaloItem, ExitCriterionHaloItem, ReactivateCriterionHaloItem } from "./item/halodragitems";

export default class PlanItemHalo extends Halo {
    /**
     * Create the halo for the plan item.
     * @param {PlanItemView} element 
     */
    constructor(element) {
        super(element);
        this.element = element;
    }

    /**
     * sets the halo images in the resizer
     */
    createItems() {
        this.addItems(ConnectorHaloItem, PropertiesHaloItem, DeleteHaloItem);
        if (!this.element.definition.isDiscretionary) {
            this.addItems(EntryCriterionHaloItem, ReactivateCriterionHaloItem, ExitCriterionHaloItem);
        }
    }
}
