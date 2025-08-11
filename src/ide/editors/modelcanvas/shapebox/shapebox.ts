import $ from "jquery";
import DragData from "../../../dragdrop/dragdata";
import CaseView from "../../../modeleditor/case/elements/caseview";
import ElementMetadata from "./elementmetadata";
import ElementRegistry from "./elementregistry";
import ShapeBoxDragData from "./shapeboxdragdata";

export default class ShapeBox {
    case: CaseView;
    html: JQuery<HTMLElement>;
    dragData?: ShapeBoxDragData;
    htmlContainer: JQuery<HTMLUListElement>;

    /**
     * Box that has the shapes that are available for dragging to the canvas
     */
    constructor(cs: CaseView, typeRegistry: ElementRegistry, htmlElement: JQuery<HTMLElement>) {
        this.case = cs;
        this.html = htmlElement;

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
        typeRegistry.viewMetadata.filter(shapeType => shapeType.hasImage).forEach(shapeType => {
            const description = shapeType.typeDescription;
            const imgURL = shapeType.smallImage;
            const html = $(`<li class="list-group-item" title="${description}">
                                <img src="${imgURL}"/>
                            </li>`);
            html.on('pointerdown', e => this.handleMouseDown(e, shapeType));
            this.htmlContainer.append(html);
        });
    }

    /**
     * Registers a drop handler with the repository browser.
     * If an item from the browser is moved over the canvas, elements can register a drop handler
     */
    setDropHandler(dropHandler: (dragData: ShapeBoxDragData) => void, filter?: (dragData: ShapeBoxDragData) => boolean) {
        if (this.dragData) this.dragData.setDropHandler(<(dragData: DragData) => void>dropHandler, <(dragData: DragData) => boolean>filter);
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
     * 
     */
    handleMouseDown(e: JQuery.TriggeredEvent, shapeType: ElementMetadata) {
        this.case.clearSelection();
        this.dragData = new ShapeBoxDragData(this, shapeType.elementType, shapeType.typeDescription, shapeType.smallImage);
    }
}
