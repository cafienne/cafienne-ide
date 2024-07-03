import DragData from "@ide/dragdata";
import CaseView from "./elements/caseview";
import ElementRegistry from "./elements/elementregistry";
import $ from "jquery";

export default class ShapeBox {
    /**
     * 
     * @param {CaseView} cs 
     * @param {JQuery<HTMLElement>} htmlElement 
     */
    constructor(cs, htmlElement) {
        this.case = cs;
        //create the Shapes which are available for dragging to the canvas
        //these Shapes are the standard CMMN Shapes, shown in menu on left hand side
        this.html = htmlElement;
        // Creating a reference to the dragData object of the repository browser; used to drag/drop shapes from the shapebox to the canvas.
        this.dragData = this.case.editor.ide.repositoryBrowser.dragData;

        const html = $(
            `<div>
    <div class="formheader">
        <label>Shapes</label>
    </div>
    <div class="shapesbody">
        <ul class="list-group"></ul>
    </div>
</div>`);
        this.html.append(html);
        //stop ghost image dragging, stop text and html-element selection
        html.on('pointerdown', e => e.preventDefault());
        this.htmlContainer = html.find('ul');
        // add shapes from element registry that have an image.
        ElementRegistry.viewMetadata.filter(shapeType => shapeType.hasImage).forEach(shapeType => {
            const description = shapeType.typeDescription;
            const imgURL = shapeType.smallImage;
            const html = $(`<li class="list-group-item" title="${description}">
                                <img src="${imgURL}"/>
                            </li>`);
            html.on('pointerdown', e => this.handleMouseDown(e, shapeType.name, description, imgURL));
            this.htmlContainer.append(html);
        });
    }

    /**
     * Registers a drop handler with the repository browser.
     * If an item from the browser is moved over the canvas, elements can register a drop handler
     * @param {Function} dropHandler
     * @param {Function} filter
     */
    setDropHandler(dropHandler, filter = undefined) {
        if (this.dragData) this.dragData.setDropHandler(dropHandler, filter);
    }

    /**
     * Removes the active drop handler and filter
     */
    removeDropHandler() {
        if (this.dragData) this.dragData.removeDropHandler();
    }

    /**
     * Handles the onmousedown event on a shape in the repository
     * The shape can be dragged to the canvas to create an element
     */
    handleMouseDown(e, shapeType, descr, imgURL) {
        this.case.clearSelection();
        this.dragData = new DragData(this.case.editor.ide, this, descr, shapeType, imgURL, undefined);
    }
}
