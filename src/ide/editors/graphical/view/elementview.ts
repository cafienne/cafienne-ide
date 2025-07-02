import { shapes } from "jointjs";
import ShapeDefinition from "../../../../repository/definition/dimensions/shape";
import ElementDefinition from "../../../../repository/definition/elementdefinition";
import GraphicalModel from "../../../../repository/definition/graphicalmodel";
import Util from "../../../../util/util";
import ModelEditor from "../../../modeleditor/modeleditor";
import Connector from "../connector/connector";
import CanvasElement from "./canvaselement";
import ModelView from "./modelview";

export default abstract class ElementView<
    D extends ElementDefinition<GraphicalModel> = ElementDefinition<GraphicalModel>,
    M extends ModelView = ModelView>
    extends CanvasElement<shapes.basic.Generic, M> {

    __connectors: Connector<ElementView<any, M>>[] = [];
    protected __childElements: ElementView<any, M>[] = [];
    protected editor: ModelEditor;

    private html_id: string = Util.createID(this.definition.id + '-'); // Copy definition id into a fixed internal html_id property to have a stable this.html search function

    constructor(modelView: M, public parent: ElementView<any, M> | undefined, public definition: D, public shape: ShapeDefinition) {
        super(modelView);

        this.editor = this.modelView.editor;

        if (this.parent) {
            this.parent.__childElements.push(this);
        }
    }

    get id(): string {
        return this.definition.id;
    }

    get name() {
        return this.definition.name;
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
        const connector = this.modelView.createConnector(this, target);
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

    abstract __select(selected: boolean): void;

    /**
     * Returns the svg markup to be rendered by joint-js.
     */
    abstract get markup(): string;


    /**
     * Determines whether the cursor is near the element, i.e., within a certain range of 'distance' pixels around this element.
     * Used to show/hide the halo of the element.
     * distance is a parameter to distinguish between moving from within to outside the element, or moving from outside towards the element.
     * In case.js, moving towards an element is "near" when within 10px, moving out of an element can be done up to 40px. 
     * 
     */
    abstract nearElement(e: JQuery.Event, distance: number): boolean;

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
        return this.modelView.__addElement(cmmnChildElement);
    }

    /**
     * Returns the raw html/svg element.
     */
    get html(): JQuery<HTMLElement> {
        // Element's ID might contain dots, slashes, etc. Escape them with a backslash
        // Source taken from https://stackoverflow.com/questions/2786538/need-to-escape-a-special-character-in-a-jquery-selector-string
        // Could also use jquery.escapeSelector, but this method is only from jquery 3 onwards, which is not in this jointjs (?)
        const jquerySelector = '#' + this.html_id.replace(/[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~]/g, "\\$&");
        return this.modelView.svg!.find(jquerySelector);
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

    abstract adoptItem(childElement: ElementView<any, M>): void;

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
     * Informs the element to render again after a change to the underlying definition has happened.
     */
    refreshView() {
        if (this.modelView.loading) {
            // No refreshing when still loading.
            //  This method is being invoked from Connector's constructor when case is being loaded
            // NOTE: overrides of this method should actually also check the same flag (not all of them do...)
            return;
        }
        this.refreshText();
        this.refreshSubViews();
        this.__childElements.forEach(child => child.refreshView());
    }
    abstract refreshText(): void;
    abstract refreshSubViews(): void;

    /**
     * delete and element and its' children if available
     */
    __delete() {
        // Deselect ourselves if we are selected, to avoid invocation of __select(false) after we have been removed.
        if (this.modelView.selectedElement == this) {
            this.modelView.selectedElement = undefined;
        }

        // First, delete our children.
        while (this.__childElements.length > 0) {
            this.__childElements[0].__delete();
        }

        // Remove resizr, halo and propertiesview; but only if they have been created
        this.deleteSubViews();

        this.__connectors.forEach(connector => connector.remove());

        // Next, inform other elements we're gonna go
        this.modelView.items.forEach(cmmnElement => cmmnElement.__removeReferences(this));

        // Now remove our definition element from the case (overridden in CaseFileItemView, since that only needs to remove the shape)
        // Also let the definition side of the house know we're leaving
        console.groupCollapsed(`Deleting ${this}`);
        this.__removeElementDefinition();
        console.groupEnd();

        // Delete us from the case
        Util.removeFromArray(this.modelView.items, this);

        // Finally remove the UI element as well. 
        this.xyz_joint.remove();
    }

    deleteSubViews() {
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


}
