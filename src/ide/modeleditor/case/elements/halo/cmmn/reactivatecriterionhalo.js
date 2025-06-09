import Halo from "../halo";
import DeleteHaloItem from "./item/click/deletehaloitem";
import PropertiesHaloItem from "./item/click/propertieshaloitem";
import ConnectorHaloItem from "./item/drag/connectorhaloitem";

export default class ReactivateCriterionHalo extends Halo {
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
