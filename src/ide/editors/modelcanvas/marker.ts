import $ from "jquery";
import CaseFileItemDef from "../../../repository/definition/cmmn/casefile/casefileitemdef";
import HtmlUtil from "../../util/htmlutil";
import ElementView from "./elementview";

export default class Marker {
    private html: JQuery<HTMLElement>;
    private scrollListener: (e: JQuery.Event) => void;

    /**
     * Implements the marker object for the element
     */
    constructor(public element: ElementView) {
        // Create global event listeners for proper attach/detach to the scrolling of the paper
        // Upon scrolling we also have to change the position of the marker.
        this.scrollListener = () => this.setPosition();

        // Note: we create the HTML directly, which in general is not good for performance.
        // However, marking object is only created once a CFI is clicked on. 
        // So, in practice it is OK to create it here and now.
        this.html = $('<div class="markelementimage"></div>');
        this.element.case.markerContainer.append(this.html);

        // Reposition the marker when the element is moving
        this.element.xyz_joint.on('change:position', (e: any) => this.setPosition());
    }

    delete() {
        HtmlUtil.removeHTML(this.html);
    }

    /**
     * Show or hide the marker if our element has a reference to the definition.
     * @param definition CaseFileItemDef | undefined
     */
    refresh(definition?: CaseFileItemDef) {
        if (definition && definition.id && this.element.referencesDefinitionElement(definition.id)) {
            this.visible = true;
        } else {
            this.visible = false;
        }
    }

    get visible(): boolean {
        return this.html.css('display') == 'block';
    }

    set visible(visible: boolean) {
        if (visible) {
            this.setPosition();
            this.element.case.paperContainer.on('scroll', this.scrollListener);
        } else {
            this.element.case.paperContainer.off('scroll', this.scrollListener);
        }
        const visibility = visible ? 'block' : 'none';
        this.html.css('display', visibility);
    }

    /** 
     * Positions marker, coordinates are the relative coordinates in the canvas graph area.
     * So (0, 0) is the top left corner of the canvas, not of the body/document
     */
    setPosition() {
        // Compensate the position of the marker for the scroll of the paper container
        // The reason is, that the marker's html element is outside the paper container, hence needs to accomodate to the scroll of the paper container
        const leftScroll = this.element.case.paperContainer.scrollLeft() || 0;
        const topScroll = this.element.case.paperContainer.scrollTop() || 0;
        const markerLeft = this.element.shape.x - leftScroll;
        const markerTop = this.element.shape.y - topScroll;

        this.html.css('left', markerLeft - 8);
        this.html.css('top', markerTop - 8);
    }
}
