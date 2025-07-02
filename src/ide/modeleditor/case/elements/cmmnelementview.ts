import { util } from "jointjs";
import CMMNDocumentationDefinition from "../../../../repository/definition/cmmndocumentationdefinition";
import CMMNElementDefinition from "../../../../repository/definition/cmmnelementdefinition";
import ShapeDefinition from "../../../../repository/definition/dimensions/shape";
import Remark from "../../../../repository/validate/remark";
import Util from "../../../../util/util";
import Grid from "../../../editors/graphical/grid";
import ElementView from "../../../editors/graphical/view/elementview";
import HtmlUtil from "../../../util/htmlutil";
import Highlighter from "../highlighter";
import Marker from "../marker";
import Resizer from "../resizer";
import CaseView from "./caseview";
import Halo from "./halo/halo";
import Properties from "./properties/properties";

export default abstract class CMMNElementView<D extends CMMNElementDefinition = CMMNElementDefinition> extends ElementView<D, CaseView> {
    protected __resizable: boolean = true;
    private __properties?: Properties;
    private _resizer?: Resizer;
    private _marker?: Marker;
    private _highlighter?: Highlighter;
    private _halo?: Halo;

    /**
     * Creates a new CMMNElementView within the case having the corresponding definition and x, y coordinates
     */
    constructor(cs: CaseView, parent: CMMNElementView | undefined, definition: D, shape: ShapeDefinition) {
        super(cs, parent, definition, shape);
        if (!shape) {
            console.warn(`${this.constructor.name}[${definition.id}] does not have a shape`);
        }

        this.modelCanvas.items.push(this);
        this.createJointElement();
    }

    /**
     * Override this method to provide type specific Properties object
     */
    protected abstract createProperties(): Properties;

    /**
     * Removes properties view when the case is refreshed.
     * Can be used in sub classes to remove other element pop up views (e.g. workflow properties in a human task)
     */
    deletePropertiesView() {
        this.__properties && this.__properties.delete();
    }

    /**
     * Returns the text to be rendered inside the shape
     */
    get text(): string {
        const documentation = this.definition.documentation.text;
        if (this.name === Util.withoutNewlinesAndTabs(documentation)) {
            return documentation;
        } else {
            return this.definition.name;
        }
    }

    /**
     * Properties show the documentation. For CaseFileItemView shape we also have
     * to render documentation, but there the "definition" refers may not be present.
     * Through this method CaseFileItemView shape can override the getter.
     */
    get documentation(): CMMNDocumentationDefinition {
        return this.definition.documentation;
    }

    /**
     * Boolean indicating whether the text to be rendered must be wrapped or not.
     */
    get wrapText() {
        return false;
    }

    /**
     * Determines whether the cursor is near the element, i.e., within a certain range of 'distance' pixels around this element.
     * Used to show/hide the halo of the element.
     * distance is a parameter to distinguish between moving from within to outside the element, or moving from outside towards the element.
     * In case.js, moving towards an element is "near" when within 10px, moving out of an element can be done up to 40px. 
     * 
     */
    nearElement(e: JQuery.Event, distance: number) {
        const offset: any = this.html.offset();

        // EventListenerView somehow have an unclear and weird positioning with jointjs. Hence we need to do some correction for that.
        //  Note that this is still not a flawless improvement :(
        const left = this.isEventListener ? offset.left - 0.5 * distance : offset.left - distance;
        const right = this.isEventListener ? offset.left + this.shape.width + 1.5 * distance : offset.left + this.shape.width + distance;
        const top = offset.top - distance;
        const bottom = offset.top + this.shape.height + distance;
        const x = e.clientX || 0;
        const y = e.clientY || 0;

        return x > left && x < right && y > top && y < bottom;
    }

    mouseEnter() {
        this.setDropHandlers();
    }

    mouseLeave() {
        this.removeDropHandlers();
    }

    /**
     * Method invoked when mouse hovers on the element
     */
    setDropHandlers() {
        this.modelCanvas.shapeBox.setDropHandler(dragData => this.addElementView(dragData.shapeType, dragData.event!), dragData => this.__canHaveAsChild(dragData.shapeType));
    }

    /**
     * Method invoked when mouse leaves the element.
     */
    removeDropHandlers() {
        this.modelCanvas.shapeBox.removeDropHandler();
    }

    /**
     * Adds a new shape in this element with the specified shape type.
     */
    addElementView(viewType: Function, e: JQuery.Event | JQuery<MouseEvent>): CMMNElementView {
        const coor = this.modelCanvas.getCursorCoordinates(e);
        const cmmnElement = this.createCMMNChild(viewType, Grid.snap(coor.x), Grid.snap(coor.y));
        // Now select the newly added element
        this.modelCanvas.selectedElement = cmmnElement;
        // Show properties of new element
        cmmnElement.propertiesView.show(true);
        return cmmnElement;
    }

    /**
     * Creates a cmmn child under this element with the specified type, and renders it at the given position.
     * @returns the newly created CMMN child
     */
    createCMMNChild(viewType: Function, x: number, y: number): CMMNElementView {
        throw new Error('Cannot create an element of type' + viewType.name);
    }

    /**
     * Invoked from the refreshView. Assumes there is a text element inside the joint element holding the text to display on the element.
     */
    refreshText() {
        const rawText = this.text;
        const formattedText = this.wrapText ? util.breakText(rawText, { width: this.shape.width, height: this.shape.height }) : rawText;
        this.xyz_joint.attr('text/text', formattedText);
    }

    refreshSubViews() {
        this.refreshHalo();
        this.refreshProperties();
    }

    refreshHalo() {
        if (this._halo && this._halo.visible) {
            this._halo.refresh();
        }
    }

    refreshProperties() {
        if (this.__properties && this.__properties.visible) {
            this.__properties.refresh();
        }
    }

    highlight(remark: Remark) {
        // this.highlighter.refresh(remark);
    }

    /**
     * Returns the "nice" type description of this CMMN Element.
     * Sub classes must implement this, otherwise an error is thrown.
     */
    get typeDescription(): string {
        if (!(this.constructor as any).typeDescription) {
            throw new Error(`The type ${(this.constructor as any).name} does not have an typeDescription function ?!`);
        }
        return (this.constructor as any).typeDescription;
    }

    get attributes() {
        return this.xyz_joint.attributes;
    }

    /**
     * Method invoked after a role or case file item has changed
     */
    refreshReferencingFields(definitionElement: CMMNElementDefinition) {
        this.propertiesView.refreshReferencingFields(definitionElement);
    }

    get propertiesView() {
        if (!this.__properties) {
            this.__properties = this.createProperties(); // Create an object to hold the element properties.
        }
        return this.__properties;
    }

    get resizer() {
        if (!this._resizer) {
            this._resizer = new Resizer(this);
        }
        return this._resizer;
    }

    deleteResizer() {
        if (this._resizer) this.resizer.delete();
    }

    get marker() {
        if (!this._marker) {
            this._marker = new Marker(this);
        }
        return this._marker;
    }

    get highlighter() {
        if (!this._highlighter) {
            this._highlighter = new Highlighter(this);
        }
        return this._highlighter;
    }

    deleteHighlighter() {
        if (this._highlighter) this.highlighter.delete();
    }

    deleteMarker() {
        if (this._marker) this.marker.delete();
    }

    abstract createHalo(): Halo;

    deleteHalo() {
        if (this._halo) this.halo.delete();
    }

    get halo() {
        if (!this._halo) {
            // Creating the halo and it's content in 2 phases to give flexibility.
            this._halo = this.createHalo();
            this._halo.createItems();
        }
        return this._halo;
    }

    /**
     * Invoked when an element is (de)selected.
     * Shows/removes a border, halo, resizer.
     */
    __select(selected: boolean) {
        if (selected) {
            //do not select element twice
            HtmlUtil.addClassOverride(this.html.find('.cmmn-shape'), 'cmmn-selected-element');
            // this.html.find('.cmmn-shape').addClass('cmmn-selected-element');
            this.__renderBoundary(true);
        } else {
            // Give ourselves default color again.
            HtmlUtil.removeClassOverride(this.html.find('.cmmn-shape'), 'cmmn-selected-element');
            // this.html.find('.cmmn-shape').removeClass('cmmn-selected-element');
            this.propertiesView.hide();
            this.__renderBoundary(false);
        }
    }

    /**
     * Show or hide the halo and resizer
     */
    __renderBoundary(show: boolean) {
        this.resizer.visible = show;
        this.halo.visible = show;
    }

    /**
     * Resizes the element, move sentries and decorators
     */
    resizing(w: number, h: number) {
        if (w < 0) w = 0;
        if (h < 0) h = 0;

        this.shape.width = w;
        this.shape.height = h;
        // Also have joint resize
        this.xyz_joint.resize(w, h);
        // Refresh the description to apply new text wrapping
        this.refreshText();
    }

    /**
     * Adds the item to our list of children, and embeds it in the joint structure of this element.
     * It is an existing item in the case.
     */
    adoptItem(childElement: CMMNElementView) {
        childElement.parent = this;
        this.__childElements.push(childElement);
        this.xyz_joint.embed(childElement.xyz_joint);
        // Also move the child's joint element toFront, to make sure it gets mouse attention before the parent.
        //  "deep" option also brings all descendents to front, maintaining order
        childElement.xyz_joint.toFront({
            deep: true
        });
    }

    /**
     * delete and element and its' children if available
     */
    __delete() {
        // Deselect ourselves if we are selected, to avoid invocation of __select(false) after we have been removed.
        if (this.modelCanvas.selectedElement == this) {
            this.modelCanvas.selectedElement = undefined;
        }

        // First, delete our children.
        while (this.__childElements.length > 0) {
            this.__childElements[0].__delete();
        }

        // Remove resizr, halo and propertiesview; but only if they have been created
        this.deleteSubViews();

        this.__connectors.forEach(connector => connector.remove());

        // Next, inform other elements we're gonna go
        this.modelCanvas.items.forEach(cmmnElement => cmmnElement.__removeReferences(this));

        // Now remove our definition element from the case (overridden in CaseFileItemView, since that only needs to remove the shape)
        // Also let the definition side of the house know we're leaving
        console.groupCollapsed(`Deleting ${this}`);
        this.__removeElementDefinition();
        console.groupEnd();

        // Delete us from the case
        Util.removeFromArray(this.modelCanvas.items, this);

        // Finally remove the UI element as well. 
        this.xyz_joint.remove();
    }

    deleteSubViews() {
        super.deleteSubViews();

        this.deleteResizer();
        this.deleteMarker();
        this.deleteHighlighter();
        this.deleteHalo();
        this.deletePropertiesView();
    }

    /**
     * Determine whether this element can have a criterion added with the specified type.
     */
    canHaveCriterion(criterionType: Function) {
        return false;
    }

    /**
     * Add a criterion to this element sourcing the incoming element.
     * Default implementation is empty, task, stage, caseplan and milestone can override it.
     */
    createCriterionAndConnect(criterionType: Function, sourceElement: CMMNElementView, e: JQuery.Event) {
        // Create a new criterion and add the source as an on part
        this.addElementView(criterionType, e).adoptOnPart(sourceElement);
    }

    /**
     * Hook for sentries to override.
     */
    adoptOnPart(sourceElement: CMMNElementView) { }

    /**
     * Hook for sentries to override.
     */
    updateConnectorLabels() { }

    /**
     * Returns true when this element references the definitionId (typically a casefile item or a role)
     */
    referencesDefinitionElement(definitionId: string) {
        return false;
    }

    get __type() {
        return `${this.constructor.name}[${this.id}]`;
    }

    toString(): string {
        return this.__type;
    }

    get isPlanItem() {
        return false;
    }

    get isTask() {
        return false;
    }

    get isTaskOrStage() {
        return false;
    }

    get isMilestone() {
        return false;
    }

    get isEventListener() {
        return false;
    }

    get isUserEvent() {
        return false;
    }

    get isTimerEvent() {
        return false;
    }

    get isStage() {
        return false;
    }

    get isCasePlan() {
        return false;
    }

    get isCaseTask() {
        return false;
    }

    get isProcessTask() {
        return false;
    }

    get isHumanTask() {
        return false;
    }

    get isCriterion() {
        return false;
    }

    get isEntryCriterion() {
        return false;
    }

    get isExitCriterion() {
        return false;
    }

    get isReactivateCriterion() {
        return false;
    }

    get isPlanningTable() {
        return false;
    }

    get isCaseFileItem() {
        return false;
    }

    get isTextAnnotation() {
        return false;
    }
}
