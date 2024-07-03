import IDE from "./ide";
import CaseFileItemView from "./modeleditor/case/elements/casefileitemview";
import $ from "jquery";

export default class DragData {
    /**
     * Simple helper class for dragging/dropping elements from either RepositoryBrowser or ShapeBox to the CaseModelEditor canvas.
     * @param {IDE} ide 
     * @param {*} owner // If drag data is finished, it will clear the dragData property on the owner object
     * @param {String} model 
     * @param {String} shapeType 
     * @param {String} imgURL 
     * @param {String} fileName 
     */
    constructor(ide, owner, model, shapeType, imgURL, fileName) {
        this.ide = ide;
        this.owner = owner;
        this.model = model;
        this.shapeType = shapeType;
        this.imgURL = imgURL;
        this.fileName = fileName;
        this.dragBox = $(`<div class="dragbox">
                                <img class="drag-image" src="${this.imgURL}"/>
                                <label class="drag-label">${this.model}</label>
                            </div>`);
        $(document.body).append(this.dragBox);

        // Create event listeners
        this.mouseMoveHandler = e => this.handleMousemoveModel(e);
        this.mouseUpHandler = e => this.handleMouseupModel(e);
        this.escapeKeyListener = e => {
            if (e.keyCode == 27) {
                // Close and clean when pressing escape
                this.cleanUp();
            }
        }

        // Off the handlers to avoid repeated addition
        $(document).off('pointermove', this.mouseMoveHandler);
        $(document).off('pointerup', this.mouseUpHandler);
        $(document).off('keydown', this.escapeKeyListener);

        // Add temporary event handlers for moving the mouse around; they will be removed when the drag data is dropped.
        $(document).on('pointermove', this.mouseMoveHandler);
        $(document).on('pointerup', this.mouseUpHandler);
        $(document).on('keydown', this.escapeKeyListener);
    }

    handleMousemoveModel(e) {
        this.ide.dragging = true;
        
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
     * @param {Function} dropHandler
     * @param {Function} filter
     */
    setDropHandler(dropHandler, filter = undefined) {
        // @ts-ignore
        this._dropHandler = dropHandler;
        this._dropFilter = filter;
    }

    /**
     * Removes the active drop handler and filter
     */
    removeDropHandler() {
        this._dropHandler = undefined;
        this._dropFilter = undefined;
    }

    canDrop(e) {
        this.event = e;
        if (!this._dropHandler) {
            // console.log("No drop handler to invoke")
        }
        const result = this._dropHandler ? this._dropFilter ? this._dropFilter(this, e) : true : false;
        return result;
    }

    handleMouseupModel(e) {
        this.event = e;
        if (this.canDrop(e)) {
            this._dropHandler(this, e);
        }
        this.cleanUp();
    }

    cleanUp() {
        this.event = undefined;
        this.ide.dragging = false;
        this.dragBox.remove();
        this.owner.dragData = undefined;

        $(document).off('pointermove', this.mouseMoveHandler);
        $(document).off('pointerup', this.mouseUpHandler);
        $(document).off('keydown', this.escapeKeyListener);
    }
}

export class CaseFileItemDragData extends DragData {
    constructor(editor, cfi) {
        super(editor.ide, editor, cfi.name, CaseFileItemView.name, CaseFileItemView.smallImage, cfi.id);
        this.item = cfi;
    }
}
