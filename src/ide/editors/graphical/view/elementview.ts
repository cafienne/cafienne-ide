import { shapes, util } from "jointjs";
import CMMNDocumentationDefinition from "../../../../repository/definition/cmmndocumentationdefinition";
import ShapeDefinition from "../../../../repository/definition/dimensions/shape";
import DocumentableElementDefinition from "../../../../repository/definition/documentableelementdefinition";
import GraphicalModel from "../../../../repository/definition/graphicalmodel";
import Remark from "../../../../repository/validate/remark";
import Util from "../../../../util/util";
import Halo from "../../../modeleditor/case/elements/halo/halo";
import Properties from "../../../modeleditor/case/elements/properties/properties";
import Highlighter from "../../../modeleditor/case/highlighter";
import Marker from "../../../modeleditor/case/marker";
import Resizer from "../../../modeleditor/case/resizer";
import ModelEditor from "../../../modeleditor/modeleditor";
import HtmlUtil from "../../../util/htmlutil";
import Connector from "../connector/connector";
import Grid from "../grid";
import CanvasElement from "./canvaselement";
import ModelCanvas from "./modelcanvas";

export default abstract class ElementView<
    D extends DocumentableElementDefinition<GraphicalModel> = DocumentableElementDefinition<GraphicalModel>,
    M extends ModelCanvas = ModelCanvas>
    extends CanvasElement<shapes.basic.Generic, M> {


    __connectors: Connector<ElementView<any, M>>[] = [];
    protected __childElements: ElementView<any, M>[] = [];
    protected editor: ModelEditor;
    private html_id: string = Util.createID(this.definition.id + '-'); // Copy definition id into a fixed internal html_id property to have a stable this.html search function

    protected __properties?: Properties;
    protected __resizable: boolean = true;
    private _resizer?: Resizer;
    private _halo?: Halo;
    private _marker?: Marker;
    private _highlighter?: Highlighter;


    constructor(modelCanvas: M, public parent: ElementView<any, M> | undefined, public definition: D, public shape: ShapeDefinition) {
        super(modelCanvas);

        this.editor = this.modelCanvas.editor;

        if (this.parent) {
            this.parent.__childElements.push(this);
        }

        if (!shape) {
            console.warn(`${this.constructor.name}[${definition.id}] does not have a shape`);
        }

        this.createJointElement();

        this.modelCanvas.items.push(this);
    }


    get id(): string {
        return this.definition.id;
    }

    get name() {
        return this.definition.name;
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


    refreshSubViews() {
        this.refreshHalo();
        this.refreshProperties();
    }


    highlight(remark: Remark) {
        // this.highlighter.refresh(remark);
    }

    /**
     * Removes a connector from the registration in this element.
     */
    __removeConnector(connector: Connector<ElementView<any, M>>): void {
        Util.removeFromArray(this.__connectors, connector);
    }
    /**
      * Registers a connector with this element.
      */
    __addConnector(connector: Connector<ElementView<any, M>>) {
        this.__connectors.push(connector);
    }

    /**
     * creates a connector between the element and the target.
     */
    __connect(target: ElementView<any, M>): Connector<ElementView<any, M>> {
        const connector = this.modelCanvas.createConnector(this, target);
        return connector;
    }

    /**
    * This method is invoked on the element if it created a connection to the target CMMNElementView
    */
    __connectTo(target: ElementView<any, M>) { }

    /**
     * This method is invoked on the element if a connection to it was made from the source CMMNElementView
     */
    __connectFrom(source: ElementView<any, M>) { }

    /**
     * returns an array of elements that are connected (through a link/connector) with this element
     */
    __getConnectedElements(): ElementView<any, M>[] {
        const connectedCMMNElements: ElementView<any, M>[] = [];
        this.__connectors.forEach(connector => {
            if (!connectedCMMNElements.find(cmmnElement => connector.source == cmmnElement || connector.target == cmmnElement)) {
                connectedCMMNElements.push(connector.source == this ? connector.target : connector.source);
            }
        });
        return connectedCMMNElements;
    }

    /**
     * Returns the connector between this and the target element with the specified id,
     * or null
     */
    __getConnector(targetId: string): Connector<ElementView<any, M>> | undefined {
        return this.__connectors.find(c => c.hasElementWithId(targetId));
    }

    /**
     * Returns the svg markup to be rendered by joint-js.
     */
    abstract get markup(): string;


    get textAttributes(): object {
        return {};
    }

    /**
        * Hook indicating that 'resizing' completed.
        */
    resized() { }

    /**
     * Method invoked during move of an element. Enables enforcing move constraints (e.g. sentries cannot be placed in the midst of an element)
     */
    moving(x: number, y: number) { }

    /**
     * Hook indicating that 'moving' completed.
     */
    moved(x: number, y: number, newParent: ElementView<any, M>) {
        // Check if this element can serve as a new parent for the cmmn element
        if (newParent && newParent.__canHaveAsChild(this.constructor) && newParent != this.parent) {
            // check if new parent is allowed
            this.changeParent(newParent);
        }
    }

    /**
     * returns true if this element can contain elements of type 'elementType'.
     * By default it returns false
     */
    __canHaveAsChild(elementType: Function) {
        return false;
    }


    /**
     * Adds an element to another element, implements element.__addElement
     */
    __addCMMNChild<E extends ElementView<any, M>>(cmmnChildElement: E): E {
        return this.modelCanvas.__addElement(cmmnChildElement);
    }

    /**
     * Returns the raw html/svg element.
     */
    get html(): JQuery<HTMLElement> {
        // Element's ID might contain dots, slashes, etc. Escape them with a backslash
        // Source taken from https://stackoverflow.com/questions/2786538/need-to-escape-a-special-character-in-a-jquery-selector-string
        // Could also use jquery.escapeSelector, but this method is only from jquery 3 onwards, which is not in this jointjs (?)
        const jquerySelector = '#' + this.html_id.replace(/[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~]/g, "\\$&");
        return this.modelCanvas.svg!.find(jquerySelector);
    }

    createJointElement() {
        const jointSVGSetup = {
            // Markup is the SVG that is rendered through the joint element; we surround the markup with an addition <g> element that holds the element id
            markup: `<g id="${this.html_id}">${this.markup}</g>`,
            // Type is used to determine whether drag/drop is supported (element border coloring)
            type: this.constructor.name,
            // Take size and position from shape.
            size: this.shape,
            position: this.shape,
            // Attrs can contain additional relative styling for the text label inside the element
            attrs: this.textAttributes
        };
        this.xyz_joint = new shapes.basic.Generic(jointSVGSetup as any);
        // Directly embed into parent
        if (this.parent && this.parent.xyz_joint) {
            this.parent.xyz_joint.embed(this.xyz_joint);
        }
        this.xyz_joint.on('change:position', (e: any) => {
            this.shape.x = this.xyz_joint.attributes.position.x;
            this.shape.y = this.xyz_joint.attributes.position.y;
        });
        // We are not listening to joint change of size, since this is only done through "our own" resizer
    }

    /**
     * Determines whether or not the cmmn element is our parent or another ancestor of us.
     */
    hasAncestor(potentialAncestor: ElementView<any, M>): boolean {
        if (!potentialAncestor) return false;
        if (!this.parent) return false;
        if (this.parent === potentialAncestor) return true;
        return this.parent.hasAncestor(potentialAncestor);
    }

    /**
     * Determines whether this stage visually surrounds the cmmn element.
     */
    surrounds(other: ElementView<any, M> | undefined) {
        // Note: this method is added here instead of directly invoking shape.surrounds because logic is different at caseplan level, so caseplan can override.
        return other && this.shape.surrounds(other.shape);
    }


    /**
     * When a item is moved from one stage to another, this method is invoked
     */
    changeParent(newParent: ElementView<any, M>) {
        if (this.parent) this.parent.releaseItem(this);
        newParent.adoptItem(this);
    }

    /**
     * Determines whether the cursor is near the element, i.e., within a certain range of 'distance' pixels around this element.
     * Used to show/hide the halo of the element.
     * distance is a parameter to distinguish between moving from within to outside the element, or moving from outside towards the element.
     * In case.js, moving towards an element is "near" when within 10px, moving out of an element can be done up to 40px. 
     * 
     */
    nearElement(e: JQuery.Event, distance: number) {
        const clientRect = this.html[0].getBoundingClientRect();

        const left = clientRect.left - distance;
        const right = clientRect.right + distance;
        const top = clientRect.top - distance;
        const bottom = clientRect.bottom + distance;
        const x = e.clientX || 0;
        const y = e.clientY || 0;

        return x > left && x < right && y > top && y < bottom;
    }


    /**
     * Method invoked after a role or case file item has changed
     */
    refreshReferencingFields(definitionElement: DocumentableElementDefinition<GraphicalModel>) {
        this.propertiesView.refreshReferencingFields(definitionElement);
    }

    /**
     * Informs the element to render again after a change to the underlying definition has happened.
     */
    refreshView() {
        if (this.modelCanvas.loading) {
            // No refreshing when still loading.
            //  This method is being invoked from Connector's constructor when case is being loaded
            // NOTE: overrides of this method should actually also check the same flag (not all of them do...)
            return;
        }
        this.refreshText();
        this.refreshSubViews();
        this.__childElements.forEach(child => child.refreshView());
    }
    /**
     * Invoked from the refreshView. Assumes there is a text element inside the joint element holding the text to display on the element.
     */
    refreshText() {
        const rawText = this.text;
        const formattedText = this.wrapText ? util.breakText(rawText, { width: this.shape.width, height: this.shape.height }) : rawText;
        this.xyz_joint.attr('text/text', formattedText);
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

    __removeElementDefinition() {
        // Remove the shape
        this.shape.removeDefinition();
        // Remove the definition
        this.definition.removeDefinition();
    }



    /**
     * Removes the imte from our list of children, and also unembeds it from the joint structure.
     * Does not delete the item.
     */
    releaseItem(childElement: ElementView<any, M>) {
        this.xyz_joint.unembed(childElement.xyz_joint);
        Util.removeFromArray(this.__childElements, childElement);
    }

    /**
     * Method invoked on all case elements upon removal of an element.
     * If there are references to the element to be removed, it can be handled here.
     */
    __removeReferences(cmmnElement: ElementView<any, M>) {
        if (cmmnElement.parent == this) {
            // Perhaps also render the parent again?? Since this element about to be deleted ...
            Util.removeFromArray(this.__childElements, cmmnElement);
        }
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
     * Override this method to provide type specific Properties object
     */
    protected abstract createProperties(): Properties;

    /**
    * Adds a new shape in this element with the specified shape type.
    */
    addElementView(viewType: Function, e: JQuery.Event | JQuery<MouseEvent>): ElementView {
        const coor = this.modelCanvas.getCursorCoordinates(e);
        const cmmnElement = this.createCMMNChild(viewType, Grid.snap(coor.x), Grid.snap(coor.y));
        // Now select the newly added element
        this.modelCanvas.selectedElement = cmmnElement;
        // Show properties of new element
        cmmnElement.propertiesView.show(true);
        return cmmnElement;
    }

    get propertiesView() {
        if (!this.__properties) {
            this.__properties = this.createProperties(); // Create an object to hold the element properties.
        }
        return this.__properties;
    }

    /**
     * Removes properties view when the case is refreshed.
     * Can be used in sub classes to remove other element pop up views (e.g. workflow properties in a human task)
     */
    deletePropertiesView() {
        this.__properties && this.__properties.delete();
    }



    /**
     * Creates a cmmn child under this element with the specified type, and renders it at the given position.
     * @returns the newly created CMMN child
     */
    createCMMNChild(viewType: Function, x: number, y: number): ElementView {
        throw new Error('Cannot create an element of type' + viewType.name);
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

    deleteSubViews() {
        this.deleteResizer();
        this.deleteMarker();
        this.deleteHighlighter();
        this.deleteHalo();
        this.deletePropertiesView();
    }

    /**
      * Adds the item to our list of children, and embeds it in the joint structure of this element.
      * It is an existing item in the case.
      */
    adoptItem(childElement: ElementView<any, M>) {
        childElement.parent = this;
        this.__childElements.push(childElement);
        this.xyz_joint.embed(childElement.xyz_joint);
        // Also move the child's joint element toFront, to make sure it gets mouse attention before the parent.
        //  "deep" option also brings all descendents to front, maintaining order
        childElement.xyz_joint.toFront({
            deep: true
        });
    }


}
