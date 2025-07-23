import $ from "jquery";
import CMMNElementDefinition from "../../../../../repository/definition/cmmnelementdefinition";
import HtmlUtil from "../../../../util/htmlutil";
import CMMNElementView from "../cmmnelementview";
import DeleteHaloItem from "./cmmn/item/click/deletehaloitem";
import PropertiesHaloItem from "./cmmn/item/click/propertieshaloitem";
import ConnectorHaloItem from "./cmmn/item/drag/connectorhaloitem";
import HaloBar from "./halobar";
import HaloItem from "./haloitem";

export default class Halo<D extends CMMNElementDefinition = CMMNElementDefinition, V extends CMMNElementView = CMMNElementView<D>> {
    html: JQuery<HTMLElement>;
    rightBar: HaloBar;
    topBar: HaloBar;
    topRightBar: HaloBar;
    leftBar: HaloBar;
    bottomBar: HaloBar;
    scrollListener: (e: JQuery.Event) => void;

    /**
     * Creates a halo for the cmmn element.
     * The content of the halo need not be set it in the constructor, but rather
     * in the implementation of the createContent() method. This is invoked right after constructor invocation.
     */
    constructor(public element: V) {
        const html = this.html = $(`<div class="halobox" element="${element.id}">
    <div class="halobar top"></div>
    <div class="halobar top-right"></div>
    <div class="halobar right"></div>
    <div class="halobar left"></div>
    <div class="halobar bottom"></div>
</div>`);
        this.element.case.haloContainer.append(html);
        this.rightBar = new HaloBar(this, html.find('.right'));
        this.topBar = new HaloBar(this, html.find('.top'));
        this.topRightBar = new HaloBar(this, html.find('.top-right'));
        this.leftBar = new HaloBar(this, html.find('.left'));
        this.bottomBar = new HaloBar(this, html.find('.bottom'));

        // Prevent the halo images from being selected while dragging the element (especially for sentries)
        this.html.on('pointermove', e => e.preventDefault());
        this.element.xyz_joint.on('change:position', () => this.setHaloPosition());
        this.element.xyz_joint.on('change:size', () => this.setHaloPosition());

        // Create global event listeners for proper attach/detach to the scrolling of the paper
        // Upon scrolling we also have to change the position of the halo.
        this.scrollListener = () => this.setHaloPosition();

        // Setting the position initially.
        this.setHaloPosition();
    }

    /**
     * Can be overridden to put the element specific content in the halo
     */
    createItems() {
        this.addItems(ConnectorHaloItem, PropertiesHaloItem, DeleteHaloItem);
    }

    /**
     * Clear all halo content, but not the surrounding structure.
     */
    clearItems() {
        this.rightBar.clear();
        this.topBar.clear();
        this.topRightBar.clear();
        this.leftBar.clear();
        this.bottomBar.clear();
    }

    /**
     * Deletes the html of the halo and the event listeners
     */
    delete() {
        this.element.case.paperContainer.off('scroll', this.scrollListener);
        HtmlUtil.removeHTML(this.html);
    }

    refresh() {
        this.clearItems();
        this.createItems();
        this.setHaloPosition();
        // Always first remove scroll listener to avoid it getting added twice.
        this.element.case.paperContainer.off('scroll', this.scrollListener);
        this.element.case.paperContainer.on('scroll', this.scrollListener);
        this.html.css('display', 'block');
    }

    get visible() {
        return this.html.css('display') == 'block';
    }

    set visible(visible: boolean) {
        if (visible) {
            // Clear and refill the halo, since underlying definitions of items may have changed.
            this.refresh();
        } else {
            this.element.case.paperContainer.off('scroll', this.scrollListener);
            this.html.css('display', 'none');
        }
    }

    get haloLeft() {
        return this.element.shape.x - this.element.case.paperContainer.scrollLeft()!;
    }

    get haloTop() {
        return this.element.shape.y - this.element.case.paperContainer.scrollTop()!;
    }

    setHaloPosition() {
        this.html.css('left', this.haloLeft);
        this.html.css('top', this.haloTop);
        this.html.width(this.element.shape.width);
        this.html.height(this.element.shape.height);
    }

    /**
     * Adds halo items according to their default location (right, top, left, bottom) to this halo.
     * It is sufficient to pass a comma separated list of the HaloItem constructors.
     */
    addItems(...haloItemConstructors: (new (h: Halo<D, V>) => HaloItem)[]) {
        haloItemConstructors.forEach(constructor => new constructor(this));
    }
}
