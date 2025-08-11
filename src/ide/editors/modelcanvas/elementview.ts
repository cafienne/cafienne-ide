import { dia, util } from '@joint/core';
import CMMNDocumentationDefinition from '../../../repository/definition/cmmndocumentationdefinition';
import CMMNElementDefinition from '../../../repository/definition/cmmnelementdefinition';
import Edge from '../../../repository/definition/dimensions/edge';
import ShapeDefinition from "../../../repository/definition/dimensions/shape";
import DocumentableElementDefinition from "../../../repository/definition/documentableelementdefinition";
import ModelDefinition from '../../../repository/definition/modeldefinition';
import Remark from "../../../repository/validate/remark";
import Util from "../../../util/util";
import CaseModelEditor from '../../modeleditor/case/casemodeleditor';
import CaseView from '../../modeleditor/case/elements/caseview';
import Connector from '../../modeleditor/case/elements/connector/connector';
import Halo from "../../modeleditor/case/elements/halo/halo";
import Properties from "../../modeleditor/case/elements/properties/properties";
import Highlighter from "../../modeleditor/case/highlighter";
import Marker from "../../modeleditor/case/marker";
import Resizer from "../../modeleditor/case/resizer";
import CanvasElement from "./canvaselement";
import Grid from "./grid";

export default abstract class ElementView<
    D extends DocumentableElementDefinition<ModelDefinition> = DocumentableElementDefinition<ModelDefinition>>
    extends CanvasElement<dia.Element> {
    readonly case: CaseView;
    protected editor: CaseModelEditor;
    protected __connectors: Connector[] = [];
    protected __childElements: ElementView<any>[] = [];
    protected __resizable: boolean = true;
    private __properties?: Properties;
    private _resizer?: Resizer;
    private _marker?: Marker;
    private _highlighter?: Highlighter;
    private _halo?: Halo;
    private html_id: string = Util.createID(this.definition.id + '-'); // Copy definition id into a fixed internal html_id property to have a stable this.html search function

    /**
     * Creates a new CaseElementView within the case having the corresponding definition and x, y coordinates
     */
    constructor(cs: CaseView, public parent: ElementView<any> | undefined, public definition: D, public shape: ShapeDefinition) {
        super(cs);
        if (!shape) {
            console.warn(`${this.constructor.name}[${definition.id}] does not have a shape`);
        }

        this.case = cs;
        this.case.items.push(this as any);
        this.editor = this.case.editor;
        if (this.parent) {
            this.parent.__childElements.push(this);
        }
        this.createJointElement();
    }

    get id() {
        return this.definition.id;
    }

    get name() {
        return this.definition.name;
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
     * Returns the raw html/svg element.
     */
    get html(): JQuery<HTMLElement> {
        // Element's ID might contain dots, slashes, etc. Escape them with a backslash
        // Source taken from https://stackoverflow.com/questions/2786538/need-to-escape-a-special-character-in-a-jquery-selector-string
        // Could also use jquery.escapeSelector, but this method is only from jquery 3 onwards, which is not in this jointjs (?)
        const jquerySelector = '#' + this.html_id.replace(/[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~]/g, "\\$&");
        return this.case.svg!.find(jquerySelector);
    }

    /**
     * Returns the svg markup to be rendered by joint-js.
     */
    abstract get markup(): string;

    abstract get markupAttributes(): any;

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
     * Determines whether or not the cmmn element is our parent or another ancestor of us.
     */
    hasAncestor(potentialAncestor: ElementView<any>): boolean {
        if (!potentialAncestor) return false;
        if (!this.parent) return false;
        if (this.parent === potentialAncestor) return true;
        return this.parent.hasAncestor(potentialAncestor);
    }

    createJointElement() {
        const defaultAttrs = {
            root: {
                fill: 'transparent',
                stroke: '#423d3d',
                strokeWidth: 1,
            },
            body: {
                fill: 'transparent',
                stroke: '#423d3d',
                strokeWidth: 1,
                vectorEffect: 'non-scaling-stroke',
            },
            label: {
                fill: 'black',
                stroke: 'none',
                fontSize: 12,
            },
        };

        const attrs: any = util.merge({}, defaultAttrs, this.markupAttributes);

        this.xyz_joint = new dia.Element({
            type: this.constructor.name,
            markup: util.svg`<g id="${this.html_id}">${this.markup}</g>` as any,
            // Take size and position from shape.
            position: {
                x: this.shape.x,
                y: this.shape.y,
            },
            size: {
                width: this.shape.width,
                height: this.shape.height,
            },
            attrs: attrs,
        });


        // Directly embed into parent
        if (this.parent && this.parent.xyz_joint) {
            this.parent.xyz_joint.embed(this.xyz_joint);
        }
        this.xyz_joint.on('change:position', (e: any) => {
            this.shape.x = this.position.x;
            this.shape.y = this.position.y;
        });
        // We are not listening to joint change of size, since this is only done through "our own" resizer
    }

    /**
     * Determines whether the cursor is near the element, i.e., within a certain range of 'distance' pixels around this element.
     * Used to show/hide the halo of the element.
     * distance is a parameter to distinguish between moving from within to outside the element, or moving from outside towards the element.
     * In case.js, moving towards an element is "near" when within 10px, moving out of an element can be done up to 40px. 
     * 
     */
    nearElement(e: JQuery.Event, distance: number) {
        const clientRect = this.html.find('[joint-selector="body"]')[0].getBoundingClientRect();

        const left = clientRect.left - distance;
        const right = clientRect.right + distance;
        const top = clientRect.top - distance;
        const bottom = clientRect.bottom + distance;
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
        this.case.shapeBox.setDropHandler(dragData => this.addElementView(dragData.shapeType, dragData.event!), dragData => this.__canHaveAsChild(dragData.shapeType));
    }

    /**
     * Method invoked when mouse leaves the element.
     */
    removeDropHandlers() {
        this.case.shapeBox.removeDropHandler();
    }

    /**
     * Adds a new shape in this element with the specified shape type.
     */
    addElementView(viewType: Function, e: JQuery.Event | JQuery<MouseEvent>): ElementView<any> {
        const coor = this.case.getCursorCoordinates(e);
        const cmmnElement = this.createCMMNChild(viewType, Grid.snap(coor.x), Grid.snap(coor.y));
        // Now select the newly added element
        this.case.selectedElement = cmmnElement as any;
        // Show properties of new element
        cmmnElement.propertiesView.show(true);
        return cmmnElement;
    }

    /**
     * Creates a cmmn child under this element with the specified type, and renders it at the given position.
     * @returns the newly created CMMN child
     */
    createCMMNChild(viewType: Function, x: number, y: number): ElementView<any> {
        throw new Error('Cannot create an element of type' + viewType.name);
    }

    /**
     * Informs the element to render again after a change to the underlying definition has happened.
     */
    refreshView() {
        if (this.case.loading) {
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
        this.xyz_joint.attr('label/text', formattedText);
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

    get position() {
        return this.xyz_joint.position();
    }

    get size() {
        return this.xyz_joint.size();
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
            this._resizer = new Resizer(this as any);
        }
        return this._resizer;
    }

    deleteResizer() {
        if (this._resizer) this.resizer.delete();
    }

    get marker() {
        if (!this._marker) {
            this._marker = new Marker(this as any);
        }
        return this._marker;
    }

    get highlighter() {
        if (!this._highlighter) {
            this._highlighter = new Highlighter(this as any);
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
            this.xyz_joint.attr('body/stroke', 'blue');
            this.__renderBoundary(true);
        } else {
            // Give ourselves default color again.
            this.xyz_joint.attr('body/stroke', '#423d3d');
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
    moved(x: number, y: number, newParent: ElementView<any>) {
        // Check if this element can serve as a new parent for the cmmn element
        if (newParent && newParent.__canHaveAsChild(this.constructor) && newParent != this.parent) {
            // check if new parent is allowed
            this.changeParent(newParent);
        }
    }

    /**
     * Adds an element to another element, implements element.__addElement
     */
    __addCMMNChild(cmmnChildElement: ElementView<any>): ElementView<any> {
        return this.case.__addElement(cmmnChildElement as any);
    }

    /**
     * When a item is moved from one stage to another, this method is invoked
     */
    changeParent(newParent: ElementView<any>) {
        if (this.parent) this.parent.releaseItem(this);
        newParent.adoptItem(this);
    }

    /**
     * Adds the item to our list of children, and embeds it in the joint structure of this element.
     * It is an existing item in the case.
     */
    adoptItem(childElement: ElementView<any>) {
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
     * Removes the imte from our list of children, and also unembeds it from the joint structure.
     * Does not delete the item.
     */
    releaseItem(childElement: ElementView<any>) {
        this.xyz_joint.unembed(childElement.xyz_joint);
        Util.removeFromArray(this.__childElements, childElement);
    }

    /**
     * Method invoked on all case elements upon removal of an element.
     * If there are references to the element to be removed, it can be handled here.
     */
    __removeReferences(cmmnElement: ElementView<any>) {
        if (cmmnElement.parent == this) {
            // Perhaps also render the parent again?? Since this element about to be deleted ...
            Util.removeFromArray(this.__childElements, cmmnElement);
        }
    }

    /**
     * delete and element and its' children if available
     */
    __delete() {
        // Deselect ourselves if we are selected, to avoid invocation of __select(false) after we have been removed.
        if (this.case.selectedElement == this as any) {
            this.case.selectedElement = undefined;
        }

        // First, delete our children.
        while (this.__childElements.length > 0) {
            this.__childElements[0].__delete();
        }

        // Remove resizr, halo and propertiesview; but only if they have been created
        this.deleteSubViews();

        this.__connectors.forEach(connector => connector.remove());

        // Next, inform other elements we're gonna go
        this.case.items.forEach(cmmnElement => cmmnElement.__removeReferences(this));

        // Now remove our definition element from the case (overridden in CaseFileItemView, since that only needs to remove the shape)
        // Also let the definition side of the house know we're leaving
        console.groupCollapsed(`Deleting ${this}`);
        this.__removeElementDefinition();
        console.groupEnd();

        // Delete us from the case
        Util.removeFromArray(this.case.items, this);

        // Finally remove the UI element as well. 
        this.xyz_joint.remove();
    }

    deleteSubViews() {
        this.deleteResizer();
        this.deleteMarker();
        this.deleteHighlighter();
        this.deleteHalo();
        this.deletePropertiesView();
    }

    __removeElementDefinition() {
        // Remove the shape
        this.shape.removeDefinition();
        // Remove the definition
        this.definition.removeDefinition();
    }

    /**
     * creates a connector between the element and the target.
     */
    __connect(target: ElementView<any>, edge?: Edge): Connector {
        if (!edge) {
            edge = this.case.dimensions.createEdge(this.definition as any, target.definition);
        }
        const connector = new Connector(this as any, target, edge);

        // Render the connector in the case.
        this.case.__addConnector(connector);

        // Inform both source and target about this new connector; just adds it to their connector collections.
        this.__addConnector(connector);
        target.__addConnector(connector);
        // Now inform source that it has connected to target
        this.adoptOutgoingConnector(connector);
        // And inform target that source has connected to it
        target.adoptIncomingConnector(connector);
        this.case.editor.completeUserAction();
        return connector;
    }

    /**
     * Hook when this element becomes the target of a new connector
     * @param connector the connector has both source and target. <pre>"connector.source"</pre> can be used to know what view element connected to us
     */
    protected adoptIncomingConnector(connector: Connector) {
    }

    /**
     * Hook when this element becomes the source of a new connector
     * @param connector the connector has both source and target. <pre>"connector.target"</pre> can be used to know what view element we connected to
     */
    protected adoptOutgoingConnector(connector: Connector) {
    }

    /**
     * Registers a connector with this element.
     */
    __addConnector(connector: Connector) {
        this.__connectors.push(connector);
    }

    /**
     * This method is invoked on the element if it created a connection to the target CaseElementView
     */
    __connectTo(target: ElementView<any>) { }

    /**
     * This method is invoked on the element if a connection to it was made from the source CaseElementView
     */
    __connectFrom(source: ElementView<any>) { }

    /**
     * Removes a connector from the registration in this element.
     */
    __removeConnector(connector: Connector) {
        Util.removeFromArray(this.__connectors, connector);
    }

    /**
     * returns an array of elements that are connected (through a link/connector) with this element
     */
    __getConnectedElements(): ElementView<any>[] {
        const connectedCMMNElements: ElementView<any>[] = [];
        this.__connectors.forEach(connector => {
            if (!connectedCMMNElements.find(cmmnElement => connector.source == cmmnElement || connector.target == cmmnElement)) {
                connectedCMMNElements.push(connector.source == this as any ? connector.target : connector.source);
            }
        });
        return connectedCMMNElements;
    }

    /**
     * Returns the connector between this and the target element with the specified id,
     * or null
     */
    __getConnector(targetId: string): Connector | undefined {
        return this.__connectors.find(c => c.hasElementWithId(targetId));
    }

    /**
     * returns true if this element can contain elements of type 'elementType'.
     * By default it returns false
     */
    __canHaveAsChild(elementType: Function) {
        return false;
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
    createCriterionAndConnect(criterionType: Function, sourceElement: ElementView<any>, e: JQuery.Event) {
        // Create a new criterion and add the source as an on part
        this.addElementView(criterionType, e).adoptOnPart(sourceElement);
    }

    /**
     * Hook for sentries to override.
     */
    adoptOnPart(sourceElement: ElementView<any>) { }

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

}

