import { dia } from '@joint/core';
import $ from "jquery";
import TextAnnotationDefinition from "../../../../repository/definition/artifact/textannotation";
import CaseDefinition from "../../../../repository/definition/cmmn/casedefinition";
import CaseFileItemDef from "../../../../repository/definition/cmmn/casefile/casefileitemdef";
import CasePlanDefinition from "../../../../repository/definition/cmmn/caseplan/caseplandefinition";
import CMMNElementDefinition from "../../../../repository/definition/cmmnelementdefinition";
import Diagram from "../../../../repository/definition/dimensions/diagram";
import Dimensions from "../../../../repository/definition/dimensions/dimensions";
import Edge from '../../../../repository/definition/dimensions/edge';
import ShapeDefinition from "../../../../repository/definition/dimensions/shape";
import Remark from "../../../../repository/validate/remark";
import Validator from "../../../../repository/validate/validator";
import Util from "../../../../util/util";
import Debugger from "../../../debugger/debugger";
import DragData from "../../../dragdrop/dragdata";
import Connector from '../../../editors/modelcanvas/connector/connector';
import Coordinates from "../../../editors/modelcanvas/connector/coordinates";
import ElementView from '../../../editors/modelcanvas/elementview';
import Grid from "../../../editors/modelcanvas/grid";
import ValidateForm from "../../../editors/validate/validateform";
import RightSplitter from "../../../splitter/rightsplitter";
import HtmlUtil from "../../../util/htmlutil";
import CaseModelEditor from "../casemodeleditor";
import CaseSourceEditor from "../editors/casesourceeditor";
import DeployForm from "../editors/deployform";
import CaseFileEditor from "../editors/file/casefileeditor";
import CaseParametersEditor from "../editors/parameters/caseparameterseditor";
import StartCaseEditor from "../editors/startcaseeditor";
import CaseTeamEditor from "../editors/team/caseteameditor";
import ShapeBox from "../shapebox/shapebox";
import UndoRedoBox from "../undoredo/undoredobox";
import CaseElementView from "./caseelementview";
import CaseFileItemView from "./casefileitemview";
import CasePlanView from "./caseplanview";
import CaseConnector from "./connector/caseconnector";
import StageView from "./stageview";
import TextAnnotationView from "./textannotationview";

export default class CaseView {
    readonly definition: CasePlanDefinition;
    readonly id: string;
    readonly name: string;
    readonly case: CaseView;
    readonly dimensions: Dimensions;
    readonly diagram: Diagram;
    readonly html: JQuery<HTMLElement>;
    readonly divCaseModel: JQuery<HTMLElement>;
    readonly divUndoRedo: JQuery<HTMLElement>;
    readonly divShapeBox: JQuery<HTMLElement>;
    readonly divCFIEditor: JQuery<HTMLElement>;
    readonly canvas: JQuery<HTMLElement>;
    readonly paperContainer: JQuery<HTMLElement>;
    readonly deployForm: DeployForm;
    readonly sourceEditor: CaseSourceEditor;
    readonly cfiEditor: CaseFileEditor;
    readonly undoBox: UndoRedoBox;
    readonly shapeBox: ShapeBox;
    readonly splitter: RightSplitter;
    readonly items: CaseElementView[] = [];
    readonly connectors: CaseConnector[] = [];
    readonly loading: boolean = false;
    casePlanModel?: CasePlanView;
    graph!: dia.Graph;
    paper!: dia.Paper;
    grid!: Grid;
    svg!: JQuery<SVGElement>;
    readonly teamEditor: CaseTeamEditor;
    readonly caseParametersEditor: CaseParametersEditor;
    readonly startCaseEditor: StartCaseEditor;
    readonly debugEditor: Debugger;
    readonly validateForm: ValidateForm;
    private _selectedElement?: CaseElementView;
    readonly typeDescription = 'Case';

    constructor(public editor: CaseModelEditor, public htmlParent: JQuery<HTMLElement>, public caseDefinition: CaseDefinition) {
        const now = new Date();
        this.editor.case = this;
        this.definition = caseDefinition.casePlan;
        this.id = this.caseDefinition.id;
        this.name = this.caseDefinition.name;
        this.case = this;
        this.dimensions = caseDefinition.dimensions!;
        this.diagram = this.dimensions.diagram;
        this.htmlParent = htmlParent;

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
            <div class="divCaseFileContainer" />
        </div>
    </div>
</div>`);
        this.htmlParent.append(this.html);

        this.divCaseModel = this.html.find('.divCaseModel');
        this.divUndoRedo = this.html.find('.undoredobox');
        this.divShapeBox = this.html.find('.shapebox');
        this.divCFIEditor = this.html.find('.divCaseFileContainer');
        this.canvas = this.divCaseModel.find('.divCaseCanvas');
        this.paperContainer = this.html.find('.paper-container');

        this.deployForm = new DeployForm(this);
        this.sourceEditor = new CaseSourceEditor(editor, this.html);
        this.cfiEditor = new CaseFileEditor(this, this.divCFIEditor);
        this.undoBox = new UndoRedoBox(this, this.divUndoRedo);
        this.shapeBox = new ShapeBox(this, this.divShapeBox);
        this.splitter = new RightSplitter(this.divCaseModel, '60%', 5);

        //add the drawing area for this case
        this.createJointStructure();

        //create the editor forms for roles, case file items, and case input and output parameters
        this.teamEditor = new CaseTeamEditor(this);
        this.caseParametersEditor = new CaseParametersEditor(this);
        this.startCaseEditor = new StartCaseEditor(this);
        this.debugEditor = new Debugger(this);
        this.validateForm = new ValidateForm(this);

        if (this.caseDefinition.hasCasePlan()) {
            this.loading = true;
            const planShape = this.diagram.getShape(this.caseDefinition.casePlan);
            if (!planShape) {
                this.editor.ide.danger(`Drawing the case plan is not possible, as the diagram information is missing (check the file ${this.dimensions.file.fileName})`);
                return;
            }
            this.casePlanModel = new CasePlanView(this, this.caseDefinition.casePlan, planShape);

            // Now render the "loose" shapes (textboxes and casefileitems) in the appropriate parent stage
            //  Also clean up remaining shapes for which no view can be created
            this.renderLooseShapesAndDropUnusedShapes();

            // Finally render all connectors
            this.diagram.edges.forEach(edge => {
                const source = this.getItem(edge.sourceId);
                const target = this.getItem(edge.targetId);

                if (!source) {
                    console.warn('Found illegal edge, without source ' + edge.sourceId, edge, target);
                    return;
                }
                if (!target) {
                    console.warn('Found illegal edge, without target ' + edge.targetId, edge, source);
                    return;
                }
                source.__connect(target, edge);
            });

            //update the usedIn column of the case file items editor
            this.cfiEditor.showUsedIn();

            // Post load - now render all items; first add them in one shot to joint. Then render the case plan (which will render it's children)
            this.loading = false;

            // Gather the joint elements of the types cmmn-element and connectors. Put them in one big array and give that to joint.
            const jointElements = this.items.map(item => item.xyz_joint as dia.Cell).concat(this.connectors.map(c => c.xyz_joint));
            this.graph.addCells(jointElements);
            this.casePlanModel.refreshView();
        }

        const end = new Date();
        console.log(`Case '${this.caseDefinition.file.fileName}' loaded in ${((end.getTime() - now.getTime()) / 1000)} seconds`)
    }

    renderLooseShapesAndDropUnusedShapes() {
        const getDefinition = (shape: ShapeDefinition) => {
            const element = this.caseDefinition.getElement(shape.cmmnElementRef);
            if (element) {
                return element;
            } else {
                // It may well be an empty, unreferenced CaseFileItemView, as that is not resizable.
                // Check if the shape has the right size to be an "empty" case file item (they must be 25*40)
                if (shape.width == 25 && shape.height == 40) {
                    return CaseFileItemDef.createEmptyDefinition(this.caseDefinition, shape.cmmnElementRef);
                } else {
                    // But if it is not, then we should print a warning
                    console.warn(`Error: found a shape without a matching definition: ${shape.toString()}`)
                    return undefined;
                }
            }
        }
        // Now render the "loose" shapes (textboxes and casefileitems) in the appropriate parent stage
        const stages = this.items.filter(element => element.isStage) as StageView[];
        this.diagram.shapes.forEach(shape => {
            const definitionElement = getDefinition(shape);
            // Only take the textboxes and case file items, not the other elements, as they are rendered from caseplanmodel constructor.
            if (definitionElement instanceof CaseFileItemDef || definitionElement instanceof TextAnnotationDefinition) {
                const parent = this.getSurroundingStage(stages, shape);
                if (definitionElement instanceof CaseFileItemDef) {
                    parent.__addCMMNChild(new CaseFileItemView(parent, definitionElement, shape));
                } else if (definitionElement instanceof TextAnnotationDefinition) {
                    parent.__addCMMNChild(new TextAnnotationView(parent, definitionElement, shape));
                }
            }

            // Now check if we have an actually view element for this shape, if not, it means we have no corresponding definition element, and then we'll remove the shape from the Dimensions.
            const view = this.items.find(view => view.shape === shape);
            if (!view) {
                this.editor.migrated("Removing unused shape " + shape.cmmnElementRef + " from " + this.dimensions.file.fileName);
                shape.removeDefinition();
            }
        });
    }

    onShow() {
        const urlQuery = window.location.hash.slice(1).split('?');
        if (urlQuery.length > 1) {
            if (urlQuery[1].startsWith('deploy=true')) {
                this.deployForm.show();
            }
        }
    }

    getSurroundingStage(stages: StageView[], shape: ShapeDefinition): StageView {
        const surroundingStages = stages.filter(stage => stage.shape.surrounds(shape));
        const smallestSurrounder = surroundingStages.find(stage => !surroundingStages.find(smaller => stage.shape.surrounds(smaller.shape)))
        return smallestSurrounder || this.casePlanModel!;
    }

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
            const underMouse = this.getItemUnderMouse(e, this.getCMMNElement(elementView));
            if (underMouse) {
                this.getCMMNElement(elementView).moved(x, y, underMouse);
                this.editor.completeUserAction();
            }
        });
        this.paper.on('element:pointerdown', (elementView: any, e: any, x: number, y: number) => {
            //select the mouse down element, do not set focus on description, makes it hard to delete
            //the element with [del] keyboard button (you delete the description io element)            
            this.selectedElement = this.getCMMNElement(elementView);
            // Unclear why, but Grid size input having focus does not blur when we click on the canvas...
            Grid.blurSetSize();
        });
        // Enforce move constraints on certain elements
        this.paper.on('element:pointermove', (elementView: any, e: any, x: number, y: number) => this.getCMMNElement(elementView).moving(x, y));
        this.paper.on('element:pointerdblclick', (elementView: any, e: any, x: number, y: number) => this.getCMMNElement(elementView).propertiesView.show(true));
        this.paper.on('blank:pointerclick', () => this.clearSelection());
        // For some reason pointerclick not always works, so also listening to pointerdown on blank.
        // see e.g. https://stackoverflow.com/questions/35443524/jointjs-why-pointerclick-event-doesnt-work-only-pointerdown-gets-fired
        this.paper.on('blank:pointerdown', () => this.clearSelection());
        // When we move over an element with the mouse, an event is raised.
        //  This event is captured to enable elements to register themselves with ShapeBox and RepositoryBrowser
        this.paper.on('element:mouseenter', (elementView: any, e: any,) => this.getCMMNElement(elementView).mouseEnter());
        this.paper.on('element:mouseleave', (elementView: any, e: any) => this.getCMMNElement(elementView).mouseLeave());
        this.paper.on('link:mouseenter', (elementView: any, e: any) => this.getConnector(elementView).mouseEnter());
        this.paper.on('link:mouseleave', (elementView: any, e: any) => this.getConnector(elementView).mouseLeave());

        // Also add special event handlers for case itself. Registers with ShapeBox to support adding case plan element if it does not exist
        this.svg.on('pointerover', (e: JQuery.Event) => this.setDropHandlers());
        // Only remove drop handlers if we're actually leaving the canvase. If we're leaving an element inside the canvas, keep things as is.
        this.svg.on('pointerout', (e: JQuery.TriggeredEvent) => e.target === e.currentTarget && this.removeDropHandlers());
        // Enable/disable the HALO when the mouse is near an item
        this.svg.on('pointermove', (e: JQuery.Event) => this.showHaloAndResizer(e));
    }

    getConnector(jointElementView: any): CaseConnector {
        return jointElementView.model.xyz_cmmn;
    }

    getCMMNElement(jointElementView: any): CaseElementView {
        return jointElementView.model.xyz_cmmn;
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
     * Renders the "source" view tab
     */
    viewSource() {
        this.clearSelection();
        this.editor.hideMovableEditors();

        this.runValidation();
        this.sourceEditor.open();
    }

    runValidation() {
        const validator = new Validator(this.case.caseDefinition).run();
        this.validateForm.loadRemarks(validator);
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
    refreshReferencingFields(definitionElement: CMMNElementDefinition) {
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
    set selectedElement(element: CaseElementView | undefined) {
        const previousSelection = this._selectedElement;
        if (previousSelection) {
            previousSelection.__select(false);
        }
        this._selectedElement = element;
        if (element) {
            element.__select(true);
        }
    }

    get selectedElement(): CaseElementView | undefined {
        return this._selectedElement;
    }

    /**
     * Clears the currently selected element, if any
     */
    clearSelection() {
        this.selectedElement = undefined;
    }

    /**
     * Trigger from CaseFileEditor to indicate that a certain definition is selected.
     * This can be used to display markers of individual CaseElementViews and their sub views.
     */
    updateSelectedCaseFileItemDefinition(definition: CaseFileItemDef | undefined) {
        this.items.forEach(item => item.marker.refresh(definition));
    }

    showHaloAndResizer(e: JQuery.Event) {
        // Algorithm for showing halo and resizers when hovering with mouse/pointer over the canvas is as follows:
        //  1. In drag/drop mode, no changes to current situation, just return;
        //  2. If an element is selected, likewise. When an element is selected, halo and resizer of that element are shown in fixed modus.
        //  3. In all other cases:
        //     - Halo of CasePlan is always visible, unless moving outside of CasePlan; resizer is only shown if CasePlan is selected.
        //       This makes the image more stable when hovering around with mouse.
        //     - When moving towards an element (including a 10px surrounding of the element), halo for that element is shown.
        //     - When moving out of element, wider border around element is used (40px), so that halo doesn't disappear too fast.
        //     - When moving out of CasePlan, then CasePlan halo is no longer visible (so that print-screens and so do not show halo always)

        if (DragData.dragging) return;
        // If an element is selected, avoid on/off behavior when the mouse moves.
        if (this.selectedElement) {
            return;
        }

        // Determine on which element the cursor is and also which halo/resizer is currently visible
        const itemUnderMouse = this.getItemUnderMouse(e);
        const currentlyVisibleHalo = this.items.find(item => item != this.casePlanModel && item.halo.visible);

        if (currentlyVisibleHalo && currentlyVisibleHalo.nearElement(e, 40) && !(itemUnderMouse && itemUnderMouse.hasAncestor(currentlyVisibleHalo))) {
            // Current halo is still visible, and we're still in the wide border around it; 
            //  Also current item under mouse is NOT a child of current halo ...
            // Then: do nothing; just keep current halo visible
        } else {
            // Hide all halos (perhaps it is sufficient to just hide current one), and show the new one (if any)
            this.items.forEach(item => item.__renderBoundary(false));
            if (itemUnderMouse) itemUnderMouse.__renderBoundary(true);
            else this.casePlanModel && this.casePlanModel.hideHalo();
        }
    }

    /**
     * Returns the deepest cmmn element under cursor. If that is equal to self, then
     * parent of self is returned.
     */
    getItemUnderMouse(e: any, self: CaseElementView | undefined = undefined): CaseElementView | undefined {
        const itemsUnderMouse = this.items.filter(item => item.nearElement(e, 10));
        const parentsUnderMouse = itemsUnderMouse.filter(item => item.parent instanceof CaseElementView).map(item => item.parent);

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
        if (!this.casePlanModel) {
            this.shapeBox.setDropHandler(dragData => this.createCasePlan(dragData.event), dragData => this.__canHaveAsChild(dragData.shapeType));
        }
    }

    removeDropHandlers() {
        this.shapeBox.removeDropHandler();
    }

    /**
     * deletes a case including elements, connectors, graph, editors
     */
    delete() {
        // Remove all our inline editors.
        this.teamEditor.delete();
        this.cfiEditor.delete();
        this.caseParametersEditor.delete();
        this.startCaseEditor.delete();
        this.sourceEditor.delete();
        this.deployForm.delete();
        this.validateForm.delete();
        this.splitter.delete();
        this.items.forEach(canvasItem => canvasItem.deletePropertiesView());
        HtmlUtil.removeHTML(this.html);
    }

    __canHaveAsChild(elementType: Function) {
        return elementType == CasePlanView && !this.casePlanModel;
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

    createCasePlan(e: JQuery<PointerEvent>) {
        const coor = this.getCursorCoordinates(e);
        this.casePlanModel = CasePlanView.createNew(this, coor.x, coor.y);
        this.__addElement(this.casePlanModel);
        this.casePlanModel.propertiesView.show(true);
        return this.casePlanModel;
    }

    __addElement(cmmnElement: CaseElementView) {
        if (this.loading) {
            return cmmnElement;
        }

        this.graph.addCells([cmmnElement.xyz_joint]);
        // TODO: this should no longer be necessary if constructors fill proper joint immediately based upon definition
        cmmnElement.refreshView();
        // TODO: figure out when to properly apply the move constraint logic
        cmmnElement.moving(cmmnElement.shape.x, cmmnElement.shape.y);

        this.editor.completeUserAction();

        // Also refresh the properties visible in the case view
        this.refreshMovableViews();

        return cmmnElement;
    }

    __addConnector(connector: CaseConnector) {
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

    __createConnector(source: ElementView<any>, target: ElementView<any>, edge: Edge): Connector {
        return new CaseConnector(source, target, edge);
    }

    /**
     * Remove an element from the canvas, including its children.
     */
    __removeElement(cmmnElement: CaseElementView) {
        console.groupCollapsed(`Removing ${cmmnElement}`);

        // Remove it; which recursively also removes the children; only then save it.
        cmmnElement.__delete();

        // And save the changes.
        this.editor.completeUserAction();

        //update the column UsedIn in the case file editor
        this.cfiEditor.showUsedIn();

        // Also refresh the properties visible in the case view
        this.refreshMovableViews();
        console.groupEnd();
    }

    getItem(id: string): CaseElementView | undefined {
        return this.items.find(item => id && item.id == id);
    }

    getCaseFileItemElement(caseFileItemID: string): CaseFileItemView | undefined {
        return this.items.find(item => item.isCaseFileItem && item.definition.id == caseFileItemID) as CaseFileItemView | undefined;
    }

    switchLabels() {
        this.diagram.connectorStyle.shiftRight();
        this.editor.ide.info(this.diagram.connectorStyle.infoMessage, 8000);
        this.items.filter(item => item.isCriterion).forEach(sentry => sentry.updateConnectorLabels());
        this.editor.saveModel();
    }
}
