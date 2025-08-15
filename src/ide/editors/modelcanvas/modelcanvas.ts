import { dia } from '@joint/core';
import $ from "jquery";
import Diagram from '../../../repository/definition/dimensions/diagram';
import Dimensions from '../../../repository/definition/dimensions/dimensions';
import Edge from '../../../repository/definition/dimensions/edge';
import DocumentableElementDefinition from '../../../repository/definition/documentableelementdefinition';
import GraphicalModelDefinition from '../../../repository/definition/graphicalmodeldefinition';
import Remark from '../../../repository/validate/remark';
import Util from '../../../util/util';
import DragData from '../../dragdrop/dragdata';
import ModelEditor from '../../modeleditor/modeleditor';
import HtmlUtil from '../../util/htmlutil';
import Connector from './connector/connector';
import Coordinates from './connector/coordinates';
import ElementView from './elementview';
import Grid from './grid';
import ShapeBox from './shapebox/shapebox';
import UndoManager from './undoredo/undomanager';
import UndoRedoBox from './undoredo/undoredobox';

export default abstract class ModelCanvas<
    ModelDefT extends GraphicalModelDefinition = GraphicalModelDefinition,
    ElemDefT extends DocumentableElementDefinition<ModelDefT> = DocumentableElementDefinition<ModelDefT>,
    BaseViewT extends ElementView<ElemDefT> = ElementView<ElemDefT>> {

    readonly id: string;
    readonly name: string;
    readonly dimensions: Dimensions;
    readonly diagram: Diagram;
    readonly html: JQuery<HTMLElement>;
    readonly divCaseModel: JQuery<HTMLElement>;
    readonly divUndoRedo: JQuery<HTMLElement>;
    readonly divShapeBox: JQuery<HTMLElement>;
    readonly canvas: JQuery<HTMLElement>;
    readonly paperContainer: JQuery<HTMLElement>;
    readonly undoBox: UndoRedoBox;
    readonly shapeBox: ShapeBox;
    readonly items: BaseViewT[] = [];
    readonly connectors: Connector[] = [];
    graph!: dia.Graph;
    paper!: dia.Paper;
    grid!: Grid;
    svg!: JQuery<SVGElement>;
    private _selectedElement?: BaseViewT;
    loading: boolean = false;

    constructor(public editor: ModelEditor,
        public htmlParent: JQuery<HTMLElement>,
        public caseDefinition: ModelDefT,
        public undoManager: UndoManager) {
        this.id = this.caseDefinition.id;
        this.name = this.caseDefinition.name;
        this.dimensions = caseDefinition.dimensions!;
        this.diagram = this.dimensions.diagram;

        this.html = $(
            `<div case="${this.id}">
    <div class="casemodeler">
        <div class="basicbox basicform undoredobox"></div>
        <div class="basicbox basicform shapebox"></div>
        <div class="divCaseModel">
            <div class="divCaseContainer">
                <div class="divCaseCanvas basicbox">
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

        this.divCaseModel = this.html.find('.divCaseModel');
        this.divUndoRedo = this.html.find('.undoredobox');
        this.divShapeBox = this.html.find('.shapebox');
        this.canvas = this.divCaseModel.find('.divCaseCanvas');
        this.paperContainer = this.html.find('.paper-container');

        this.undoBox = new UndoRedoBox(this, this.divUndoRedo);

        this.shapeBox = this.createShapeBox(this.divShapeBox);

        //add the drawing area for this case
        this.createJointStructure();
    }
    abstract createShapeBox(htmlElement: JQuery<HTMLElement>): ShapeBox;

    createJointStructure() {
        this.graph = new dia.Graph();

        //create drawing area (SVG), all elements will be drawn in here
        this.paper = new dia.Paper({
            el: this.paperContainer[0],
            width: '6000px',
            height: '6000px',
            gridSize: 1,
            perpendicularLinks: true,
            model: this.graph,
        });

        this.grid = new Grid(this.paper, this.editor.ide);

        this.paper.svg.setAttribute('case', this.id);

        //this.paper.svg has the html element, also store the jQuery svg
        this.svg = $(this.paper.svg);

        // Attach paper events
        this.paper.on('cell:pointerup', (elementView: any, e: any, x: number, y: number) => {
            const underMouse = this.getItemUnderMouse(e, this.getElement(elementView));
            if (underMouse) {
                this.getElement(elementView).moved(x, y, underMouse);
                this.editor.completeUserAction();
            }
        });
        this.paper.on('element:pointerdown', (elementView: any, e: any, x: number, y: number) => {
            //select the mouse down element, do not set focus on description, makes it hard to delete
            //the element with [del] keyboard button (you delete the description io element)            
            this.selectedElement = this.getElement(elementView);
            // Unclear why, but Grid size input having focus does not blur when we click on the canvas...
            Grid.blurSetSize();
        });
        // Enforce move constraints on certain elements
        this.paper.on('element:pointerdblclick', (elementView: any, e: any, x: number, y: number) => this.getElement(elementView).propertiesView.show(true));
        this.paper.on('blank:pointerclick', () => this.clearSelection());
        // For some reason pointerclick not always works, so also listening to pointerdown on blank.
        // see e.g. https://stackoverflow.com/questions/35443524/jointjs-why-pointerclick-event-doesnt-work-only-pointerdown-gets-fired
        this.paper.on('blank:pointerdown', () => this.clearSelection());
        // When we move over an element with the mouse, an event is raised.
        //  This event is captured to enable elements to register themselves with ShapeBox and RepositoryBrowser
        this.paper.on('element:mouseenter', (elementView: any, e: any,) => this.getElement(elementView).mouseEnter());
        this.paper.on('element:mouseleave', (elementView: any, e: any) => this.getElement(elementView).mouseLeave());
        this.paper.on('link:mouseenter', (elementView: any, e: any) => this.getConnector(elementView).mouseEnter());
        this.paper.on('link:mouseleave', (elementView: any, e: any) => this.getConnector(elementView).mouseLeave());

        // Also add special event handlers for case itself. Registers with ShapeBox to support adding case plan element if it does not exist
        this.svg.on('pointerover', (e: JQuery.Event) => this.setDropHandlers());
        // Only remove drop handlers if we're actually leaving the canvase. If we're leaving an element inside the canvas, keep things as is.
        this.svg.on('pointerout', (e: JQuery.TriggeredEvent) => e.target === e.currentTarget && this.removeDropHandlers());
        // Enable/disable the HALO when the mouse is near an item
        this.svg.on('pointermove', (e: JQuery.Event) => this.showHaloAndResizer(e));
    }

    getConnector(jointElementView: any): Connector {
        return jointElementView.model.xyz_cde;
    }

    getElement(jointElementView: any): BaseViewT {
        return jointElementView.model.xyz_cde;
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

    highlight(remark: Remark) {
        const view = this.items.find(item => item.definition === remark.element)
        if (view) {
            view.highlight(remark);
        }
    }

    /**
     * Method invoked after a role or case file item has changed
     */
    refreshReferencingFields(definitionElement: ElemDefT) {
        // First tell all items to update their properties, if they refer to this element.
        this.items.forEach(item => item.refreshReferencingFields(definitionElement));
        // Also update the sub editors.
        this.editor.movableEditors.forEach(editor => editor.refreshReferencingFields(definitionElement));
    }

    refreshMovableViews() {
        this.editor.movableEditors.filter(editor => editor.visible).forEach(editor => editor.refresh());
    }

    /**
     * Sets/gets the element currently (to be) selected.
     * Upon setting a new selection, the previously selected element is de-selected
     */
    set selectedElement(element: BaseViewT | undefined) {
        const previousSelection = this._selectedElement;
        if (previousSelection) {
            previousSelection.__select(false);
        }
        this._selectedElement = element;
        if (element) {
            element.__select(true);
        }
    }

    get selectedElement(): BaseViewT | undefined {
        return this._selectedElement;
    }

    /**
     * Clears the currently selected element, if any
     */
    clearSelection() {
        this.selectedElement = undefined;
    }

    showHaloAndResizer(e: JQuery.Event) {
        // Algorithm for showing halo and resizers when hovering with mouse/pointer over the canvas is as follows:
        //  1. In drag/drop mode, no changes to current situation, just return;
        //  2. If an element is selected, likewise. When an element is selected, halo and resizer of that element are shown in fixed modus.
        //  3. In all other cases:
        //     - When moving towards an element (including a 10px surrounding of the element), halo for that element is shown.
        //     - When moving out of element, wider border around element is used (40px), so that halo doesn't disappear too fast.

        if (DragData.dragging) return;
        // If an element is selected, avoid on/off behavior when the mouse moves.
        if (this.selectedElement) {
            return;
        }

        // Determine on which element the cursor is and also which halo/resizer is currently visible
        const itemUnderMouse = this.getItemUnderMouse(e);
        const currentlyVisibleHalo = this.items.find(item => item.halo.visible);

        if (currentlyVisibleHalo && currentlyVisibleHalo.nearElement(e, 40) && !(itemUnderMouse && itemUnderMouse.hasAncestor(currentlyVisibleHalo))) {
            // Current halo is still visible, and we're still in the wide border around it; 
            //  Also current item under mouse is NOT a child of current halo ...
            // Then: do nothing; just keep current halo visible
        } else {
            // Hide all halos (perhaps it is sufficient to just hide current one), and show the new one (if any)
            this.items.forEach(item => item.__renderBoundary(false));
            if (itemUnderMouse) {
                itemUnderMouse.__renderBoundary(true);
            }
        }
    }

    /**
     * Returns the deepest element under cursor. If that is equal to self, then
     * parent of self is returned.
     */
    getItemUnderMouse(e: any, self: BaseViewT | undefined = undefined): BaseViewT | undefined {
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

    setDropHandlers() {
    }

    removeDropHandlers() {
    }

    /**
     * deletes a case including elements, connectors, graph, editors
     */
    delete() {
        // Remove all our inline editors.
        this.items.forEach(canvasItem => canvasItem.deletePropertiesView());
        HtmlUtil.removeHTML(this.html);
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

    __addElement<ViewT extends BaseViewT>(element: ViewT): ViewT {
        if (this.loading) {
            return element;
        }

        this.graph.addCells([element.xyz_joint]);
        // TODO: this should no longer be necessary if constructors fill proper joint immediately based upon definition
        element.refreshView();
        // TODO: figure out when to properly apply the move constraint logic
        element.moving(element.shape.x, element.shape.y);

        this.editor.completeUserAction();

        // Also refresh the properties visible in the case view
        this.refreshMovableViews();

        return element;
    }

    __addConnector(connector: Connector) {
        this.connectors.push(connector);
        if (!this.loading) {
            this.graph.addCells([connector.xyz_joint]);
        }
    }

    /**
     * Remove a connector from the registration. This method is invoked when the connector
     * is already removed from the canvas.
     */
    __removeConnector(connector: Connector) {
        connector.edge.removeDefinition();
        Util.removeFromArray(this.connectors, connector);
    }

    __createConnector(source: ElementView, target: ElementView, edge: Edge): Connector {
        return new Connector(source, target, edge);
    }

    /**
     * Remove an element from the canvas, including its children.
     */
    __removeElement(element: BaseViewT) {
        console.groupCollapsed(`Removing ${element}`);

        // Remove it; which recursively also removes the children; only then save it.
        element.__delete();

        // And save the changes.
        this.editor.completeUserAction();

        // Also refresh the properties visible in the case view
        this.refreshMovableViews();
        console.groupEnd();
    }

    getItem(id: string): BaseViewT | undefined {
        return this.items.find(item => id && item.id == id);
    }
}
