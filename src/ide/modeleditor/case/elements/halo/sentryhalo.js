import { EntryCriterionView, ExitCriterionView, ReactivateCriterionView } from "../sentryview";
import Halo from "./halo";
import { DeleteHaloItem, PropertiesHaloItem } from "./item/haloclickitems";
import { ConnectorHaloItem, EntryCriterionHaloItem, ExitCriterionHaloItem } from "./item/halodragitems";

export class EntryCriterionHalo extends Halo {
    /**
     * Create the halo for the entry criterion.
     * @param {EntryCriterionView} element 
     */
    constructor(element) {
        super(element);
        this.element = element;
    }

    /**
     * sets the halo images in the resizer
     */
    createItems() {
        this.addItems(ConnectorHaloItem, ExitCriterionHaloItem, PropertiesHaloItem, DeleteHaloItem);
    }
}

export class ReactivateCriterionHalo extends Halo {
    /**
     * Create the halo for the entry criterion.
     * @param {ReactivateCriterionView} element 
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
    }
}

export class ExitCriterionHalo extends Halo {
    /**
     * Create the halo for the exit criterion.
     * @param {ExitCriterionView} element 
     */
    constructor(element) {
        super(element);
        this.element = element;
    }

    //sets the halo images in the resizer
    createItems() {
        this.addItems(ConnectorHaloItem, EntryCriterionHaloItem, PropertiesHaloItem, DeleteHaloItem);
    }
}
