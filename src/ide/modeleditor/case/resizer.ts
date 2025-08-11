import $ from "jquery";
import Grid from "../../editors/modelcanvas/grid";
import HtmlUtil from "../../util/htmlutil";
import CMMNElementView from "./elements/cmmnelementview";

type ResizeDirection = 'nw' | 'n' | 'ne' | 'w' | 'e' | 'sw' | 's' | 'se';

export default class Resizer {
    element: CMMNElementView;
    html: JQuery<HTMLElement>;
    scrollListener: (e: JQuery.Event) => void;
    startX!: number;
    startY!: number;
    startW!: number;
    startH!: number;
    downX!: number;
    downY!: number;
    mouseMoveHandler!: (e: JQuery.Event) => void;
    mouseUpHandler!: (e: JQuery.Event) => void;

    /**
     * Implements the resizer object for the element
     * @param element CMMNElementView
     */
    constructor(element: CMMNElementView) {
        this.element = element;

        // Create global event listeners for proper attach/detach to the scrolling of the paper
        this.scrollListener = (e: JQuery.Event) => this.setPosition();

        // Create the HTML for the resizer
        this.html = $(`<div class="resizebox" element="${this.element.toString()}">
    <div class="fence"></div>
</div>`);
        this.element.case.resizeContainer.append(this.html);

        // Add the corner resize handles, nw = north west etc
        if ((this.element as any).__resizable) {
            this.addResizeHandles('nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se');
        }

        // Reposition the resizer when the element is moving
        this.element.xyz_joint.on('change:position', (e: any) => this.setPosition());
    }

    delete() {
        HtmlUtil.removeHTML(this.html);
    }

    get visible(): boolean {
        return this.html.css('display') == 'block';
    }

    set visible(visible: boolean) {
        if (visible) {
            this.setPosition();
            this.setSize();
            this.element.case.paperContainer.on('scroll', this.scrollListener);
        } else {
            this.element.case.paperContainer.off('scroll', this.scrollListener);
        }
        const visibility = visible ? 'block' : 'none';
        this.html.css('display', visibility);
    }

    /** 
     * Positions resizer, coordinates are the relative coordinates in the canvas graph area.
     * So (0, 0) is the top left corner of the canvas, not of the body/document
     */
    setPosition() {
        // Compensate the position of the resizer for the scroll of the paper container
        const leftScroll = this.element.case.paperContainer.scrollLeft() || 0;
        const topScroll = this.element.case.paperContainer.scrollTop() || 0;
        const resizerLeft = this.element.shape.x - leftScroll;
        const resizerTop = this.element.shape.y - topScroll;

        this.html.css('left', resizerLeft);
        this.html.css('top', resizerTop);
    }

    /**
     * Sets the dimensions of the resizer
     */
    setSize() {
        this.html.width(this.element.shape.width);
        this.html.height(this.element.shape.height);
    }

    /**
     * Handles the moving of an element to position the resizer around the element
     * This event handler is invoked from case.js
     */
    handleMoveElement(elementView: CMMNElementView, e: JQuery.Event, x: number, y: number) {
        this.setPosition();
    }

    /**
     * Handles mousedown on handle of resizer, to resize an element
     */
    handleMouseDown(e: JQuery.Event, resizeDirection: ResizeDirection) {
        e.stopPropagation();
        e.preventDefault();
        this.element.propertiesView.hide();

        // Store the original dimensions
        this.startX = this.element.position.x;
        this.startY = this.element.position.y;
        this.startW = this.element.size.width;
        this.startH = this.element.size.height;
        // Store the coordinate of mousedown
        this.downX = e.clientX || 0;
        this.downY = e.clientY || 0;

        // Start listening to mouse move and mouseup
        this.mouseMoveHandler = (evt: JQuery.Event) => this.handleMouseMove(evt, resizeDirection);
        this.mouseUpHandler = (evt: JQuery.Event) => this.handleMouseUp(evt);

        // Off the handlers to avoid repeated addition
        $(document).off('pointermove', this.mouseMoveHandler);
        $(document).off('pointerup', this.mouseUpHandler);

        $(document).on('pointermove', this.mouseMoveHandler);
        $(document).on('pointerup', this.mouseUpHandler);
    }

    /**
     * Handles mousemove on handle of resizer, to resize an element
     */
    handleMouseMove(e: JQuery.Event, resizeDirection: ResizeDirection) {
        e.preventDefault();

        const jointElement = this.element.xyz_joint;

        // For new position and size. dx, dy for coordinate change
        let x: number, y: number, w: number, h: number, dx: number, dy: number;

        const eX = jointElement.position().x;
        const eY = jointElement.position().y;

        const coor = this.element.case.getCursorCoordinates(e);

        // Depending on the selected handle the element should resize differently
        // Determine the new position/size of the element AND resizer
        switch (resizeDirection) {
            case 'nw':
                x = coor.x;
                y = coor.y;
                w = this.startX - coor.x + this.startW;
                h = this.startY - coor.y + this.startH;
                dx = x - eX;
                dy = y - eY;
                break;
            case 'n':
                x = this.startX;
                y = coor.y;
                w = this.startW;
                h = this.startY - coor.y + this.startH;
                dx = 0;
                dy = y - eY;
                break;
            case 'ne':
                x = this.startX;
                y = coor.y;
                w = coor.x - this.startX;
                h = this.startY - coor.y + this.startH;
                dx = 0;
                dy = y - eY;
                break;
            case 'w':
                x = coor.x;
                y = this.startY;
                w = this.startX - coor.x + this.startW;
                h = this.startH;
                dx = x - eX;
                dy = 0;
                break;
            case 'e':
                x = this.startX;
                y = this.startY;
                w = coor.x - this.startX;
                h = this.startH;
                dx = 0;
                dy = 0;
                break;
            case 'sw':
                x = coor.x;
                y = this.startY;
                w = this.startX - coor.x + this.startW;
                h = coor.y - this.startY;
                dx = x - eX;
                dy = 0;
                break;
            case 's':
                x = this.startX;
                y = this.startY;
                w = this.startW;
                h = coor.y - this.startY;
                dx = 0;
                dy = 0;
                break;
            case 'se':
                x = this.startX;
                y = this.startY;
                w = coor.x - this.startX;
                h = coor.y - this.startY;
                dx = 0;
                dy = 0;
                break;
            default:
                return;
        }

        // Now make resize snap to grid, unless CTRL key is pressed
        w = Grid.snap(w);
        h = Grid.snap(h);
        x = Grid.snap(x);
        y = Grid.snap(y);
        dx = Grid.snap(dx);
        dy = Grid.snap(dy);

        if (w == this.startW && h == this.startH) {
            // Nothing was resized...
            return;
        }

        // Set size of element and resizer
        this.element.resizing(w, h);
        this.setSize(); // Resize the resizer as well

        // Set position of element and resizer
        this.setPosition();
        jointElement.translate(dx, dy);
    }

    /**
     * Handles the mouseup after resizing
     */
    handleMouseUp(e: JQuery.Event) {
        $(document).off('pointermove', this.mouseMoveHandler);
        $(document).off('pointerup', this.mouseUpHandler);

        // Tell the element that it has been resized
        this.element.resized();

        this.element.case.editor.completeUserAction();
    }

    addResizeHandles(...handles: ResizeDirection[]) {
        handles.forEach(handle => {
            const html = $(`<div handle="${handle}" class="resizehandle ${handle}"><div style="cursor:${handle}-resize"></div></div>`);
            html.on('pointerdown', (e: JQuery.Event) => this.handleMouseDown(e, handle));
            this.html.append(html);
        });
    }
}
