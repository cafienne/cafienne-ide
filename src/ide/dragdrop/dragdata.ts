import $ from "jquery";

export default class DragData {
    protected static current: DragData | undefined = undefined;

    static get dragging(): boolean {
        return DragData.current !== undefined;
    }

    get event(): JQuery<PointerEvent> {
        if (!this.activeEvent) throw new Error('No active event found. DragData is not currently being dragged.');
        return this.activeEvent;
    }

    private activeEvent: JQuery<PointerEvent> | undefined;
    private dragBox: JQuery<HTMLElement>;
    private pointerMoveHandler = (e: any) => this.handleMousemoveModel(e);
    private pointerUpHandler = (e: any) => this.handleMouseupModel(e);
    private escapeKeyListener = (e: any) => {
        if (e.keyCode == 27) {
            // Close and clean when pressing escape
            this.cleanUp();
        }
    }

    private dropHandler: ((dragData: any) => void) | undefined = undefined;
    private dropFilter: ((dragData: any) => boolean) | undefined = undefined;

    /**
     * Simple helper class for dragging/dropping elements from either RepositoryBrowser or ShapeBox to the CaseModelEditor canvas.
     * @param owner // If drag data is finished, it will clear the dragData property on the owner object
     */
    constructor(private owner: any, public label: string, public imgURL: string) {
        this.dragBox = $(`<div class="dragbox">
                                <img class="drag-image" src="${this.imgURL}"/>
                                <label class="drag-label">${this.label}</label>
                            </div>`);
        $(document.body).append(this.dragBox);

        // Create event listeners
        this.pointerMoveHandler = e => this.handleMousemoveModel(e);
        this.pointerUpHandler = e => this.handleMouseupModel(e);
        this.escapeKeyListener = e => {
            if (e.keyCode == 27) {
                // Close and clean when pressing escape
                this.cleanUp();
            }
        }

        // Off the handlers to avoid repeated addition
        $(document).off('pointermove', this.pointerMoveHandler);
        $(document).off('pointerup', this.pointerUpHandler);
        $(document).off('keydown', this.escapeKeyListener);

        // Add temporary event handlers for moving the mouse around; they will be removed when the drag data is dropped.
        $(document).on('pointermove', this.pointerMoveHandler);
        $(document).on('pointerup', undefined, this.pointerUpHandler);
        $(document).on('keydown', this.escapeKeyListener);
    }

    handleMousemoveModel(e: any) { // e is a JQuery<PointerEvent>
        DragData.current = this;

        //position the drag image
        this.dragBox.offset({
            top: e.pageY,
            left: e.pageX + 10 //+10 such that cursor is not above drag image, messes up the events
        });

        //model can be dragged over properties menu or elements
        if (this.canDrop(e)) {
            this.dragBox.addClass('drop-allowed');
            this.dragBox.removeClass('drop-not-allowed');
        } else {
            this.dragBox.addClass('drop-not-allowed');
            this.dragBox.removeClass('drop-allowed');
        }
    }

    /**
     * Registers a drop handler with the repository browser.
     * If an item from the browser is moved over the canvas, elements can register a drop handler
     */
    setDropHandler<D extends DragData>(dropHandler: (dragData: D) => void, filter: ((dragData: D) => boolean) | undefined = undefined) {
        this.dropHandler = dropHandler;
        this.dropFilter = filter;
    }

    /**
     * Removes the active drop handler and filter
     */
    removeDropHandler() {
        this.dropHandler = undefined;
        this.dropFilter = undefined;
    }

    canDrop(e: JQuery<PointerEvent>) {
        this.activeEvent = e;
        if (!this.dropHandler) {
            // console.log("No drop handler to invoke")
        }
        const result = this.dropHandler ? this.dropFilter ? this.dropFilter(this) : true : false;
        return result;
    }

    handleMouseupModel(e: JQuery<PointerEvent>) {
        this.activeEvent = e;
        if (this.canDrop(e) && this.dropHandler) {
            this.dropHandler(this);
        }
        this.cleanUp();
    }

    cleanUp() {
        this.activeEvent = undefined;
        DragData.current = undefined;
        this.dragBox.remove();
        this.owner.dragData = undefined;

        $(document).off('pointermove', this.pointerMoveHandler);
        $(document).off('pointerup', this.pointerUpHandler);
        $(document).off('keydown', this.escapeKeyListener);
    }
}
