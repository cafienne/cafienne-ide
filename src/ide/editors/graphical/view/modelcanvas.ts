import { dia } from "jointjs";
import $ from "jquery";
import Diagram from "../../../../repository/definition/dimensions/diagram";
import Dimensions from "../../../../repository/definition/dimensions/dimensions";
import DocumentableElementDefinition from "../../../../repository/definition/documentableelementdefinition";
import GraphicalModel from "../../../../repository/definition/graphicalmodel";
import Util from "../../../../util/util";
import ModelEditor from "../../../modeleditor/modeleditor";
import RightSplitter from "../../../splitter/rightsplitter";
import Connector from "../connector/connector";
import Coordinates from "../connector/coordinates";
import Grid from "../grid";
import ShapeBox from "../shapebox/shapebox";
import CanvasElement from "./canvaselement";
import ElementView from "./elementview";

export default abstract class ModelCanvas<
    M extends GraphicalModel = GraphicalModel,
    D extends DocumentableElementDefinition<M> = DocumentableElementDefinition<M>,
    V extends ElementView<D, any> = ElementView<D, any>> {

    readonly id: string;
    readonly name: string;
    private _selectedElement?: V;


    readonly html: JQuery<HTMLElement>;

    readonly divModel: JQuery<HTMLElement>;
    readonly canvas: JQuery<HTMLElement>;
    readonly paperContainer: JQuery<HTMLElement>;

    readonly divUndoRedo: JQuery<HTMLElement>;
    readonly divShapeBox: JQuery<HTMLElement>;
    readonly shapeBox: ShapeBox<this>;
    splitter!: RightSplitter;


    graph!: dia.Graph;
    paper!: dia.Paper;
    grid!: Grid;

    svg!: JQuery<SVGElement>;
    dimensions: Dimensions;
    diagram: Diagram;

    loading: boolean = false;
    readonly items: V[] = [];
    readonly connectors: Connector<V>[] = [];


    constructor(
        public readonly editor: ModelEditor,
        public readonly htmlParent: JQuery<HTMLElement>,
        public model: M) {
        this.dimensions = model.dimensions!;
        this.diagram = this.dimensions.diagram;
        this.id = model.id;
        this.name = model.name;

        this.html = $(
            `<div case="${this.id}">
                <div class="modelview">
                    <div class="basicbox basicform undoredobox"></div>
                    <div class="basicbox basicform shapebox"></div>
                    <div class="divModel">
                        <div>
                            <div class="divCanvas basicbox">
                                <div class="paper-container-scroller">
                                    <div class="paper-container" />
                                    <div class="divResizers"></div>
                                    <div class="divHalos"></div>
                                    <div class="divMarker"></div>
                                    <img class="halodragimgid" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`);
        this.htmlParent.append(this.html);

        this.divModel = this.html.find('.divModel');
        this.canvas = this.divModel.find('.divCanvas');

        this.divUndoRedo = this.html.find('.undoredobox');
        this.divShapeBox = this.html.find('.shapebox');
        this.paperContainer = this.html.find('.paper-container');
        this.shapeBox = this.createShapeBox();

        //add the drawing area for this case
        this.createJointStructure();
    }

    abstract createShapeBox(): ShapeBox<this>;
    abstract createConnector(source: V, target: V): Connector<V>;

    createJointStructure() {
        this.graph = new dia.Graph();

        //create drawing area (SVG), all elements will be drawn in here
        this.paper = new dia.Paper({
            el: this.paperContainer[0],
            width: '6000px',
            height: '6000px',
            gridSize: 1,
            perpendicularLinks: true,
            model: this.graph
        });

        this.grid = new Grid(this.paper, this.editor.ide);

        this.paper.svg.setAttribute('case', this.id);

        //this.paper.svg has the html element, also store the jQuery svg
        this.svg = $(this.paper.svg);

        // Attach paper events
        this.paper.on('cell:pointerup', (cell: any, e: any, x: number, y: number) => {
            const elementView = this.getElementView(cell);
            const underMouse = this.getItemUnderMouse(e, elementView);
            if (underMouse && elementView) {
                elementView.moved(x, y, underMouse);
                this.editor.completeUserAction();
            }
        });
        this.paper.on('element:pointerdown', (elementView: any, e: any, x: number, y: number) => {
            //select the mouse down element, do not set focus on description, makes it hard to delete
            //the element with [del] keyboard button (you delete the description io element)            
            this.selectedElement = this.getElementView(elementView);
            // Unclear why, but Grid size input having focus does not blur when we click on the canvas...
            Grid.blurSetSize();
        });

        // Enforce move constraints on certain elements
        this.paper.on('element:pointermove', (elementView: any, e: any, x: number, y: number) => this.getElementView(elementView).moving(x, y));
        this.paper.on('element:pointerdblclick', (elementView: any, e: any, x: number, y: number) => this.getElementView(elementView).propertiesView.show(true));
        this.paper.on('blank:pointerclick', () => this.clearSelection());

        // For some reason pointerclick not always works, so also listening to pointerdown on blank.
        // see e.g. https://stackoverflow.com/questions/35443524/jointjs-why-pointerclick-event-doesnt-work-only-pointerdown-gets-fired
        this.paper.on('blank:pointerdown', () => this.clearSelection());

        // Enforce move constraints on certain elements
        this.paper.on('element:pointermove', (elementView: any, e: any, x: number, y: number) => this.getElementView(elementView).moving(x, y));
        this.paper.on('blank:pointerclick', () => this.clearSelection());

        // When we move over an element with the mouse, an event is raised.
        //  This event is captured to enable elements to register themselves with ShapeBox and RepositoryBrowser
        this.paper.on('element:mouseenter', (elementView: any, e: any, x: number, y: number) => this.getElementView(elementView).mouseEnter());
        this.paper.on('element:mouseleave', (elementView: any, e: any, x: number, y: number) => this.getElementView(elementView).mouseLeave());
        this.paper.on('link:mouseenter', (elementView: any, e: any, x: number, y: number) => this.getConnector(elementView).mouseEnter());
        this.paper.on('link:mouseleave', (elementView: any, e: any, x: number, y: number) => this.getConnector(elementView).mouseLeave());

        // Also add special event handlers for case itself. Registers with ShapeBox to support adding case plan element if it does not exist
        this.svg.on('pointerover', (e: JQuery.Event) => this.setDropHandlers());
        // Only remove drop handlers if we're actually leaving the canvase. If we're leaving an element inside the canvas, keep things as is.
        this.svg.on('pointerout', (e: JQuery.TriggeredEvent) => e.target === e.currentTarget && this.removeDropHandlers());
        // Enable/disable the HALO when the mouse is near an item
        this.svg.on('pointermove', (e: JQuery.Event) => this.showHaloAndResizer(e));

    }

    abstract setDropHandlers(): void;
    abstract removeDropHandlers(): void;
    abstract showHaloAndResizer(e: JQuery.Event): void;

    getConnector(jointElementView: joint.dia.LinkView): Connector<V> {
        return CanvasElement.fromJoint(jointElementView.model);
    }

    getElementView(jointElementView: joint.dia.ElementView): V {
        return CanvasElement.fromJoint(jointElementView.model);
    }

    /**
     * Returns the coordinates of the mouse pointer, relative with respect to the top left of the case canvas
     */
    getCursorCoordinates(e: JQuery.Event | JQuery<MouseEvent>) {
        const clientX = (e as any).clientX || 0;
        const clientY = (e as any).clientY || 0;
        const offset = this.svg.offset()!;
        return new Coordinates(clientX - offset.left, clientY - offset.top);
    }

    /**
     * Returns the deepest cmmn element under cursor. If that is equal to self, then
     * parent of self is returned.
     */
    getItemUnderMouse(e: any, self: V | undefined = undefined): V | undefined {
        const itemsUnderMouse = this.items.filter(item => item.nearElement(e, 10));
        const parentsUnderMouse = itemsUnderMouse.filter(item => item.parent).map(item => item.parent);

        // If self is passed, then the collections need to filter it out.
        if (self) {
            Util.removeFromArray(itemsUnderMouse, self);
            Util.removeFromArray(parentsUnderMouse, self.parent);
        }
        const itemUnderMouse = this.items.find(item => itemsUnderMouse.indexOf(item) >= 0 && parentsUnderMouse.indexOf(item) < 0);
        // console.log("Current item under mouse is "+(itemUnderMouse && itemUnderMouse.name));
        return itemUnderMouse;
    }

    getItem(id: string): V | undefined {
        return this.items.find(item => id && item.id == id);
    }

    /**
       * Returns the container in which Halos can render their HTML elements.
       */
    get haloContainer() {
        return this.html.find('.divHalos');
    }

    /**
     * Returns the container in which Resizers can render their HTML elements.
     */
    get resizeContainer() {
        return this.html.find('.divResizers');
    }

    /**
     * Returns the container in which Marker can render their HTML element.
     */
    get markerContainer() {
        return this.html.find('.divMarker');
    }

    /**
     * Add an item to the model view. This method is invoked when the item is added to the canvas.
     */
    __addConnector(connector: Connector<V>) {
        this.connectors.push(connector);
        if (!this.loading) {
            this.graph.addCells([connector.xyz_joint]);
        }
    }

    /**
     * Remove a connector from the registration. This method is invoked when the connector
     * is already removed from the canvas.
     */
    __removeConnector(connector: Connector<V>) {
        connector.edge.removeDefinition();
        Util.removeFromArray(this.connectors, connector);
    }

    completeUserAction() {
        this.editor.completeUserAction();
    }

    /**
     * Sets/gets the element currently (to be) selected.
     * Upon setting a new selection, the previously selected element is de-selected
     */
    set selectedElement(element: V | undefined) {
        const previousSelection = this._selectedElement;
        if (previousSelection) {
            previousSelection.__select(false);
        }
        this._selectedElement = element;
        if (element) {
            element.__select(true);
        }
    }

    get selectedElement(): V | undefined {
        return this._selectedElement;
    }

    /**
     * Clears the currently selected element, if any
     */
    clearSelection() {
        this.selectedElement = undefined;
    }

    __addElement<E extends ElementView<any, this>>(cmmnElement: E): E {
        if (this.loading) {
            return cmmnElement;
        }

        this.graph.addCells([cmmnElement.xyz_joint]);
        // TODO: this should no longer be necessary if constructors fill proper joint immediately based upon definition
        cmmnElement.refreshView();
        // TODO: figure out when to properly apply the move constraint logic
        cmmnElement.moving(cmmnElement.shape.x, cmmnElement.shape.y);

        this.editor.completeUserAction();

        return cmmnElement;
    }

    /**
     * Remove an element from the canvas, including its children.
     */
    __removeElement(cmmnElement: V) {
        // Remove it; which recursively also removes the children; only then save it.
        cmmnElement.__delete();

        // And save the changes.
        this.editor.completeUserAction();

    }
}
