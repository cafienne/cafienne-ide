import Halo from "../halo";
import DeleteHaloItem from "./item/click/deletehaloitem";
import PropertiesHaloItem from "./item/click/propertieshaloitem";
import ConnectorHaloItem from "./item/drag/connectorhaloitem";
import EntryCriterionHaloItem from "./item/drag/entrycriterionhaloitem";


export default class ExitCriterionHalo extends Halo {
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
