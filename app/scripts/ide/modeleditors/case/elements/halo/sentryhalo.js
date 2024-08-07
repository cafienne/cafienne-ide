class EntryCriterionHalo extends Halo {
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

class ReactivateCriterionHalo extends Halo {
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
        this.addItems(ConnectorHaloItem, PropertiesHaloItem, DeleteHaloItem);
    }
}

class ExitCriterionHalo extends Halo {
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
