import $ from "jquery";
import TemporaryConnector from "../connector/temporaryconnector";
import Halo from "./halo";
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
