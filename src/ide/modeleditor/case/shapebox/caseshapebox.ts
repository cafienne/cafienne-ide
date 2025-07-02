import $ from "jquery";
import ShapeBox from "../../../editors/graphical/shapebox/shapebox";
import CaseView from "../elements/caseview";
import ElementRegistry from "./elementregistry";

export default class CaseShapeBox extends ShapeBox<CaseView> {

    /**
     * Box that has the CMMN shapes that are available for dragging to the canvas
     */
    constructor(cs: CaseView, htmlElement: JQuery<HTMLElement>) {
        super(cs, htmlElement);
        ElementRegistry.initialize();
        // add shapes from element registry that have an image.
        ElementRegistry.viewMetadata.filter(shapeType => shapeType.hasImage).forEach(shapeType => {
            const description = shapeType.typeDescription;
            const imgURL = shapeType.smallImage;
            const html = $(`<li class="list-group-item" title="${description}">
                                <img src="${imgURL}"/>
                            </li>`);
            html.on('pointerdown', e => this.handleMouseDown(e, shapeType));
            this.htmlContainer.append(html);
        });
    }
}
