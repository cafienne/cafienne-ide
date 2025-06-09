import Halo from "../../../halo";
import HaloDragItem from "../../../halodragitem";

export default abstract class SentryHaloItem extends HaloDragItem {
    dragImage: JQuery<HTMLElement>;

    constructor(halo: Halo, private haloType: Function) {
        super(halo, (haloType as any).smallImage, (haloType as any).typeDescription, halo.rightBar);
        this.dragImage = halo.element.case.html.find('.halodragimgid');
    }

    handleMouseDown(e: JQuery.TriggeredEvent) {
        super.handleMouseDown(e);
        this.dragImage.attr('src', this.imgURL);
        this.dragImage.css('display', 'block');
        this.positionDragImage(e);
    }

    handleMouseMove(e: JQuery.TriggeredEvent) {
        super.handleMouseMove(e);
        this.positionDragImage(e);
    }

    clear() {
        super.clear();
        this.dragImage.css('display', 'none');
    }

    /**
     * positions the halo drag image next to the cursor
     */
    positionDragImage(e: JQuery.TriggeredEvent) {
        const coordinates = this.getCoordinates(e);
        const x = coordinates.x;
        const y = coordinates.y;
        const w = this.dragImage.innerWidth() || 0;
        const h = this.dragImage.innerHeight() || 0;
        this.dragImage.css('top', y - h / 2);
        this.dragImage.css('left', x - w / 2);
    }

    handleMouseUp(e: JQuery.TriggeredEvent) {
        super.handleMouseUp(e);
        const newParent = this.halo.element.case.getItemUnderMouse(e);
        if (newParent && newParent.canHaveCriterion(this.haloType)) {
            newParent.createCriterionAndConnect(this.haloType, this.halo.element, e);
        }
    }
}
