import HaloDragItem from "../../../halodragitem";

export default class SentryHaloItem extends HaloDragItem {
    /**
     * Returns the default bar in which this item appears
     * @param {Halo} halo
     */
    static defaultBar(halo) {
        return halo.rightBar;
    }

    constructor(halo, imgURL, title) {
        super(halo, imgURL, title);
        this.dragImage = this.element.case.html.find('.halodragimgid');
    }

    handleMouseDown(e) {
        super.handleMouseDown(e);
        this.dragImage.attr('src', this.imgURL);
        this.dragImage.css('display', 'block');
        this.positionDragImage(e);
    }

    handleMouseMove(e) {
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
    positionDragImage(e) {
        const coordinates = this.getCoordinates(e);
        const x = coordinates.x;
        const y = coordinates.y;
        const w = this.dragImage.innerWidth();
        const h = this.dragImage.innerHeight();
        this.dragImage.css('top', y - h / 2);
        this.dragImage.css('left', x - w / 2);
    }

    handleMouseUp(e) {
        super.handleMouseUp(e);
        const newParent = this.element.case.getItemUnderMouse(e);
        if (newParent && newParent.canHaveCriterion(this.haloType)) {
            newParent.createCriterionAndConnect(this.haloType, this.element, e);
        }
    }

    /** @returns {String} */
    get haloType() {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }
}
