import CasePlanView from "../../caseplanview";
import { TemporaryConnector } from "../../connector";
import EventListenerView from "../../eventlistenerview";
import { EntryCriterionView, ExitCriterionView, ReactivateCriterionView } from "../../sentryview";
import Halo from "../halo";
import HaloItem from "./haloitem";

export default class HaloDragItem extends HaloItem {
    /**
     * 
     * @param {Halo} halo 
     * @param {String} imgURL 
     * @param {String} title 
     */
    constructor(halo, imgURL, title) {
        super(halo, imgURL, title);
        this.html.on('pointerdown', e => this.handleMouseDown(e));
    }

    /** 
     * Handles mousedown in a halo image (the images to drag e.g connector from element),
     * depending on the halo type a different action is required
     */
    handleMouseDown(e) {
        e.preventDefault();

        //get the haloType
        const haloImg = $(e.currentTarget)[0];

        // Start listening to mouse move and mouseup
        this.mouseMoveHandler = e => this.handleMouseMove(e);
        this.mouseUpHandler = e => this.handleMouseUp(e);
        this.keyDownHandler = e => this.handleKeyDown(e);

        // Off the handlers to avoid repeated addition
        $(document).off('pointermove', this.mouseMoveHandler);
        $(document).off('pointerup', this.mouseUpHandler);
        $(document).off('keydown', this.keyDownHandler);

        $(document).on('pointermove', this.mouseMoveHandler);
        $(document).on('pointerup', this.mouseUpHandler);
        $(document).on('keydown', this.keyDownHandler);

        // Hide current properties view
        this.halo.element.propertiesView.hide();

        // Create a temporary connector to the current coordinates
        this.tempConnector = new TemporaryConnector(this.halo.element, this.getCoordinates(e));
    }

    getCoordinates(e) {
        return this.element.case.getCursorCoordinates(e);
    }

    handleKeyDown(e) {
        if (e.keyCode == 27) { // Esc key
            e.stopPropagation();
            e.preventDefault();
            this.clear();
        }
    }

    clear() {
        $(document).off('pointermove', this.mouseMoveHandler);
        $(document).off('pointerup', this.mouseUpHandler);
        $(document).off('keydown', this.keyDownHandler);
        // Remove the temp connector
        this.tempConnector.remove();
    }

    /** 
     * Handles mousemove after halo mousedown
     */
    handleMouseMove(e) {
        // Move the temporary connector to current coordinates
        this.tempConnector.target = this.getCoordinates(e);
    }

    /**
     * Handles mousup after mousedown on halo
     * @param {*} e 
     * @param {String} haloType
     * @param {Function} action
     */
    handleMouseUp(e) {
        e.stopPropagation();
        e.preventDefault();
        this.clear(); // Clean up our content.
    }
}

export class ConnectorHaloItem extends HaloDragItem {
    /**
     * Returns the default bar in which this item appears
     * @param {Halo} halo 
     */
    static defaultBar(halo) {
        if (halo.element instanceof EventListenerView) {
            return halo.topRightBar;
        }
        return halo.rightBar;
    }

    constructor(halo) {
        super(halo, 'images/link_black_128.png', 'Connector');
    }

    handleMouseUp(e) {
        super.handleMouseUp(e);
        // A 'plain' connector is dragged from the halo, try to link it with the target element
        // at the position of the cursor.
        // Connectors to the case plan are not created, because that looks silly.
        //  As a matter of fact, connecting to a parent stage also still looks silly. Need to find a better solution.
        const cmmnElement = this.element.case.getItemUnderMouse(e);
        if (cmmnElement && !(cmmnElement instanceof CasePlanView)) {
            // Note, we should connect to the source of the tempConnector, not to this.element;
            //  The reason is, that in between some other logic may have selected a new object,
            //  resulting in a new this.element.
            this.element.__connect(cmmnElement);
            this.element.case.selectedElement = cmmnElement;
        }
    }
}

export class SentryHaloItem extends HaloDragItem {
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

export class EntryCriterionHaloItem extends SentryHaloItem {
    constructor(halo) {
        super(halo, EntryCriterionView.smallImage, EntryCriterionView.typeDescription);
    }

    get haloType() {
        return EntryCriterionView.name;
    }
}

export class ReactivateCriterionHaloItem extends SentryHaloItem {
    constructor(halo) {
        super(halo, ReactivateCriterionView.smallImage, ReactivateCriterionView.typeDescription);
    }

    get haloType() {
        return ReactivateCriterionView.name;
    }
}

export class ExitCriterionHaloItem extends SentryHaloItem {
    constructor(halo) {
        super(halo, ExitCriterionView.smallImage, ExitCriterionView.typeDescription);
    }

    get haloType() {
        return ExitCriterionView.name;
    }
}
