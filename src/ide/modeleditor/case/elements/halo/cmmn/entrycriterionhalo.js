import Halo from "../halo";
import DeleteHaloItem from "./item/click/deletehaloitem";
import PropertiesHaloItem from "./item/click/propertieshaloitem";
import ConnectorHaloItem from "./item/drag/connectorhaloitem";
import ExitCriterionHaloItem from "./item/drag/exitcriterionhaloitem";


export default class EntryCriterionHalo extends Halo {
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
