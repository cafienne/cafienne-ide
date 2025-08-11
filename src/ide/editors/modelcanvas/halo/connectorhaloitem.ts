import Images from "../../../util/images/images";
import Halo from "./halo";
import HaloDragItem from "./halodragitem";

export default class ConnectorHaloItem extends HaloDragItem<Halo> {
    constructor(halo: Halo) {
        super(halo, Images.Link, 'Connector', halo.rightBar);
    }

    handleMouseUp(e: JQuery.TriggeredEvent) {
        super.handleMouseUp(e);
        // A 'plain' connector is dragged from the halo, try to link it with the target element
        // at the position of the cursor.
        // Creating a connector to parent elements looks a bit weird and is therefore avoided.
        const cmmnElement = this.halo.element.case.getItemUnderMouse(e);
        if (cmmnElement && !this.halo.element.hasAncestor(cmmnElement)) {
            this.halo.element.__connect(cmmnElement);
            this.halo.element.case.selectedElement = cmmnElement;
        }
    }
}
