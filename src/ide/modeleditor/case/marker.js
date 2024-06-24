import CaseFileItemDef from "@repository/definition/cmmn/casefile/casefileitemdef";
import CMMNElementView from "./elements/cmmnelementview";

export default class Marker {
    /**
     * implements the marker object for the element
     * @param {CMMNElementView} element
     */
    constructor(element) {
        this.element = element;

        // Create global event listeners for proper attach/detach to the scrolling of the paper
        //  Upon scrolling we also have to change the position of the marker.
        this.scrollListener = e => this.setPosition();

        // Note: we create the HTML directly, which in general is not good for performance.
        //  However, marking object is only created once a CFI is clicked on. 
        //  So, in practice it is a OK to create it here and now.
        this.html = $('<div class="markelementimage"></div>');
        this.element.case.markerContainer.append(this.html);

        // Reposition the marker when the element is moving
        this.element.xyz_joint.on('change:position', e => this.setPosition());
    }

    delete() {
        Util.removeHTML(this.html);
    }

    /**
     * Show or hide the marker if our element has a reference to the definition.
     * @param {CaseFileItemDef|undefined} definition 
     */
    refresh(definition) {
        if (definition && definition.id && this.element.referencesDefinitionElement(definition.id)) {
            this.visible = true;
        } else {
            this.visible = false;
        }
    }

    get visible() {
        return this.html.css('display') == 'block';
    }

    set visible(visible) {
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
        //compensate the position of the marker for the scroll of the paper container
        // The reason is, that the marker's html element is outside the paper container, hence needs to accomodate to the scroll of the paper container
        const markerLeft = this.element.shape.x - this.element.case.paperContainer.scrollLeft();
        const markerTop = this.element.shape.y - this.element.case.paperContainer.scrollTop();

        this.html.css('left', markerLeft - 8);
        this.html.css('top', markerTop - 8);
    }
}
