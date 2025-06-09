import Images from "../../../../../../../util/images/images";
import Halo from "../../../halo";
import HaloDragItem from "../../../halodragitem";

export default class ConnectorHaloItem extends HaloDragItem {
    constructor(halo: Halo) {
        super(halo, Images.Link, 'Connector', halo.element.isEventListener ? halo.topRightBar : halo.rightBar);
    }

    handleMouseUp(e: JQuery.TriggeredEvent) {
        super.handleMouseUp(e);
        // A 'plain' connector is dragged from the halo, try to link it with the target element
        // at the position of the cursor.
        // Connectors to the case plan are not created, because that looks silly.
        //  As a matter of fact, connecting to a parent stage also still looks silly. Need to find a better solution.
        const cmmnElement = this.halo.element.case.getItemUnderMouse(e);
        if (cmmnElement && !(cmmnElement.isCasePlan)) {
            // Note, we should connect to the source of the tempConnector, not to this.element;
            //  The reason is, that in between some other logic may have selected a new object,
            //  resulting in a new this.element.
            this.halo.element.__connect(cmmnElement);
            this.halo.element.case.selectedElement = cmmnElement;
        }
    }
}
