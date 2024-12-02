import TextAnnotationDefinition from "@definition/artifact/textannotation";
import CaseDefinition from "@definition/cmmn/casedefinition";
import CaseFileItemDef from "@definition/cmmn/casefile/casefileitemdef";
import CMMNElementDefinition from "@definition/cmmnelementdefinition";
import ShapeDefinition from "@definition/dimensions/shape";
import Util from "@util/util";
import { dia } from "jointjs";
import ValidateForm from "@ide/modeleditor/case/validate/validateform";
import ValidationContext from "@repository/validate/validation";
import Debugger from "../../../debugger/debugger";
import RightSplitter from "../../../splitter/rightsplitter";
import CaseModelEditor from "../casemodeleditor";
import CaseSourceEditor from "../editors/casesourceeditor";
import Deploy from "../editors/deploy";
import CaseFileEditor from "../editors/file/casefileeditor";
import CaseParametersEditor from "../editors/parameters/caseparameterseditor";
import RolesEditor from "../editors/roleseditor";
import StartCaseEditor from "../editors/startcaseeditor";
import ShapeBox from "../shapebox/shapebox";
import Grid from "../grid";
import UndoRedoBox from "../undoredo/undoredobox";
import CaseFileItemView from "./casefileitemview";
import CasePlanView from "./caseplanview";
import CMMNElementView from "./cmmnelementview";
import Connector from "./connector";
import StageView from "./stageview";
import TextAnnotationView from "./textannotationview";
import $ from "jquery";
import DragData from "@ide/dragdrop/dragdata";

export default class CaseView {
    /**
     * Creates a new CaseView object based on the definition and dimensions
     * @param {CaseModelEditor} editor
     * @param {JQuery<HTMLElement>} htmlParent
     * @param {CaseDefinition} caseDefinition 
     */
    constructor(editor, htmlParent, caseDefinition) {
        const now = new Date();
        this.editor = editor;
        this.editor.case = this; // Quick hack to have inline editors have access to the case in their constructor
        this.caseDefinition = caseDefinition;
        this.id = this.caseDefinition.id;
        this.name = this.caseDefinition.name;
        this.case = this;
        this.dimensions = caseDefinition.dimensions;
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

        this.deployForm = new Deploy(this);
        this.sourceEditor = new CaseSourceEditor(editor, this.html);
        this.cfiEditor = new CaseFileEditor(this, this.divCFIEditor);
        this.undoBox = new UndoRedoBox(this, this.divUndoRedo);
        this.shapeBox = new ShapeBox(this, this.divShapeBox);
        this.splitter = new RightSplitter(this.divCaseModel, '60%', 5);

        this.items = /** @type {Array<CMMNElementView>} */ ([]);
        this.connectors = /** @type {Array<Connector>} */ ([]);

        //add the drawing area for this case
        this.createJointStructure();

        //create the editor forms for roles, case file items, and case input and output parameters
        this.rolesEditor = new RolesEditor(this);
        this.caseParametersEditor = new CaseParametersEditor(this);
        this.startCaseEditor = new StartCaseEditor(this);
        this.debugEditor = new Debugger(this);

        if (this.caseDefinition.hasCasePlan()) {
            this.loading = true;
            this.casePlanModel = new CasePlanView(this, this.caseDefinition.casePlan, this.diagram.getShape(this.caseDefinition.casePlan));

            const getDefinition = shape => {
                const element = caseDefinition.getElement(shape.cmmnElementRef);
                if (element) {
                    return element;
                } else {
                    // It may well be an empty, unreferenced CaseFileItemView, as that is not resizable; let CaseFileItemView figure that out
                    const emptyCaseFileItem = CaseFileItemView.createElementForShape(caseDefinition, shape);
                    if (emptyCaseFileItem) {
                        emptyCaseFileItem.id = shape.cmmnElementRef;
                    } else {
                        // But if it is not, then we should print a warning
                        console.warn(`Error: found a shape without a matching definition: ${shape.toString()}`)
                    }
                    return emptyCaseFileItem;
                }
            }
            // Now render the "loose" shapes (textboxes and casefileitems) in the appropriate parent stage            
            const stages = /** @type {Array<StageView>} */ (this.items.filter(element => element.isStage));
            this.diagram.shapes.forEach(shape => {
                const definitionElement = getDefinition(shape);
                // Only take the textboxes and case file items, not the other elements, as they are rendered from caseplanmodel constructor.
                if (definitionElement instanceof CaseFileItemDef || definitionElement instanceof TextAnnotationDefinition) {
                    const parent = this.getSurroundingStage(stages, shape);
                    if (definitionElement instanceof CaseFileItemDef) {
                        parent.__addCMMNChild(new CaseFileItemView(parent, definitionElement, shape));
                    } else if (definitionElement instanceof TextAnnotationDefinition) {
                        parent.__addCMMNChild(new TextAnnotationView(parent, definitionElement, shape));
                    } else {
                        // Quite weird :)
                    }
                }
                const view = this.items.find(view => view.shape === shape);
                if (definitionElement && !view) {
                    this.editor.migrated("Removing unused shape " + shape.cmmnElementRef +" from " + this.dimensions.file.fileName);
                    shape.removeDefinition();
                }
            });

            // Finally render all connectors
            this.diagram.edges.forEach(edge => Connector.createConnectorFromEdge(this, edge));

            //update the usedIn column of the case file items editor
            this.cfiEditor.showUsedIn();

            // Post load - now render all items; first add them in one shot to joint. Then render the case plan (which will render it's children)
            this.loading = false;

            // Gather the joint elements of the types cmmn-element and connectors. Put them in one big array and give that to joint.
            const jointElements = this.items.map(item => item.xyz_joint).concat(this.connectors.map(c => c.xyz_joint));
            this.graph.addCells(jointElements);
            this.casePlanModel.refreshView();
        }
        this.validateForm = new ValidateForm(this);

        const end = new Date();
        console.log(`Case '${this.caseDefinition.file.fileName}' loaded in ${((end - now) / 1000)} seconds`)
    }

    onShow() {
        const urlQuery = window.location.hash.slice(1).split('?');
        if (urlQuery.length > 1) {
            if (urlQuery[1].startsWith('deploy=true')) {
                this.deployForm.show();
            }
        }
    }

    /**
     * 
     * @param {Array<StageView>} stages 
     * @param {ShapeDefinition} shape 
     * @returns {StageView}
     */
    getSurroundingStage(stages, shape) {
        const surroundingStages = stages.filter(stage => stage.shape.surrounds(shape));
        const smallestSurrounder = surroundingStages.find(stage => !surroundingStages.find(smaller => stage.shape.surrounds(smaller.shape)))
        return smallestSurrounder || this.casePlanModel;
    }

    createJointStructure() {
        this.graph = new dia.Graph();

        //create drawing area (SVG), all elements will be drawn in here
        this.paper = new dia.Paper({
            el: this.paperContainer,
            width: '6000px',
            height: '6000px',
            gridSize: 1,
            perpendicularLinks: true,
            model: this.graph
        });

        this.grid = new Grid(this.paper, this);

        this.paper.svg.setAttribute('case', this.id);

        //cs.paper.svg has the html element, also store the jQuery svg
        this.svg = $(this.paper.svg);

        // Attach paper events
        this.paper.on('cell:pointerup', (elementView, e, x, y) => {
            this.getCMMNElement(elementView).moved(x, y, this.getItemUnderMouse(e, this.getCMMNElement(elementView)));
            this.editor.completeUserAction();
        });
        this.paper.on('element:pointerdown', (elementView, e, x, y) => {
            //select the mouse down element, do not set focus on description, makes it hard to delete
            //the element with [del] keyboard button (you delete the description io element)
            this.selectedElement = this.getCMMNElement(elementView);
            // Unclear why, but Grid size input having focus does not blur when we click on the canvas...
            Grid.blurSetSize();
        });
        this.paper.on('element:pointermove', (elementView, e, x, y) => this.getCMMNElement(elementView).__moveConstraint(x, y)); // Enforce move constraints on certain elements
        this.paper.on('element:pointerdblclick', (elementView, e, x, y) => this.getCMMNElement(elementView).propertiesView.show(true));
        this.paper.on('blank:pointerclick', () => this.clearSelection()); // For some reason pointerclick not always works, so also listening to pointerdown on blank.
        this.paper.on('blank:pointerdown', () => this.clearSelection()); // see e.g. https://stackoverflow.com/questions/35443524/jointjs-why-pointerclick-event-doesnt-work-only-pointerdown-gets-fired
        // When we move over an element with the mouse, an event is raised.
        //  This event is captured to enable elements to register themselves with ShapeBox and RepositoryBrowser
        this.paper.on('element:mouseenter', (elementView, e, x, y) => this.getCMMNElement(elementView).mouseEnter());
        this.paper.on('element:mouseleave', (elementView, e, x, y) => this.getCMMNElement(elementView).mouseLeave());
        this.paper.on('link:mouseenter', (elementView, e, x, y) => this.getConnector(elementView).mouseEnter());
        this.paper.on('link:mouseleave', (elementView, e, x, y) => this.getConnector(elementView).mouseLeave());

        // Also add special event handlers for case itself. Registers with ShapeBox to support adding case plan element if it does not exist
        this.svg.on('pointerover', e => this.setDropHandlers());
        // Only remove drop handlers if we're actually leaving the canvase. If we're leaving an element inside the canvas, keep things as is.
        this.svg.on('pointerout', e => e.target === e.currentTarget && this.removeDropHandlers());
        // Enable/disable the HALO when the mouse is near an item
        this.svg.on('pointermove', e => this.showHaloAndResizer(e));
    }

    /**
     * 
     * @param {*} jointElementView 
     * @returns {Connector}
     */
    getConnector(jointElementView) {
        return jointElementView.model.xyz_cmmn;
    }

    /**
     * 
     * @param {*} jointElementView 
     * @returns {CMMNElementView}
     */
    getCMMNElement(jointElementView) {
        return jointElementView.model.xyz_cmmn;
    }

    /**
     * Returns the container in which Halos can render their HTML elements.
     * @returns {JQuery<HTMLElement>}
     */
    get haloContainer() {
        return this.html.find('.divHalos');
    }

    /**
     * Returns the container in which Resizers can render their HTML elements.
     * @returns {JQuery<HTMLElement>}
     */
    get resizeContainer() {
        return this.html.find('.divResizers');
    }

    /**
     * Returns the container in which Marker can render their HTML element.
     * @returns {JQuery<HTMLElement>}
     */
    get markerContainer() {
        return this.html.find('.divMarker');
    }

    repositionSplitter() {
        /*When dragging this repository browser splitter, the splitter between the canvas and cfiEditor is not automatically updated
        Here recalculate the position of the splitter and the width of the canvas.

        canvaswidth is the width of the shapes/canvas/cfi container
        minus the shapes width minus cfiEditor Width, and compensate for width of gap between areas
        */

        const containerWidth = this.htmlParent.width(); // Our parent's parent is "divCaseModelEditor"
        const containerLeft = this.htmlParent.offset().left;
        const cfiBoxWidth = this.divCFIEditor.width();
        const shapesWidth = this.divShapeBox.width();
        const cfiBoxLeft = this.divCFIEditor.offset().left;

        const canvasWidth = containerWidth - shapesWidth - cfiBoxWidth - containerLeft + cfiBoxLeft;

        this.divCaseModel.css('width', canvasWidth);
    }

    refreshSplitter() {
        // Recalculate the splitter position in % after refresh
        const splitterPosition = 100 - (100 * this.divCFIEditor.width() / this.divCaseModel.width());
        const splitterPercentage = splitterPosition > 0 ? `${splitterPosition}%` : '0%';

        this.splitter.repositionSplitter(splitterPercentage);
    }

    /**
     * Renders the "source" view tab
     */
    viewSource() {
        this.clearSelection();
        this.editor.hideMovableEditors();

        this.runValidation();

        if (this.validateForm.validationContext.problems.length > 0) {
            this.validateForm.show();
        }

        this.sourceEditor.open();
    }

    runValidation() {
        let validationContext = ValidationContext.runValidation(this.caseDefinition, this.editor.ide.repository);
        this.showValidationSummary(validationContext);
        this.validateForm.renderData(validationContext);
    }

    showValidationSummary(validationContext)
    {
       // Shows the number of errors and warnings in the case footer
       const iErrors = validationContext.errors.length;
       const iWarnings = validationContext.warnings.length;

       const validateLabel = $('.validateLabel');
       validateLabel.html(`CMMN Validation found ${iErrors} issue${iErrors == 1 ? '' : 's'} and ${iWarnings} suggestion${iWarnings == 1 ? '' : 's'}`);
       validateLabel.css('color', iErrors > 0 ? 'red' : iWarnings > 0 ? 'orange' : 'grey');
       if (iErrors == 0 && iWarnings == 0) {
           validateLabel.html('');
       }
   }

    /**
     * Method invoked after a role or case file item has changed
     * @param {CMMNElementDefinition} definitionElement 
     */
    refreshReferencingFields(definitionElement) {
        // First tell all items to update their properties, if they refer to this element.
        this.items.forEach(item => item.refreshReferencingFields(definitionElement));
        // Also update the sub editors.
        this.editor.movableEditors.forEach(editor => editor.refreshReferencingFields(definitionElement));
    }

    refreshMovableViews() {
        this.editor.movableEditors.filter(view => view.visible).forEach(editor => editor.refresh());
    }

    /**
     * Sets/gets the element currently (to be) selected.
     * Upon setting a new selection, the previously selected element is de-selected
     * @param {CMMNElementView} element
     */
    set selectedElement(element) {
        const previousSelection = this._selectedElement;
        if (previousSelection) {
            previousSelection.__select(false);
        }
        this._selectedElement = element;
        if (element) {
            element.__select(true);
        }
    }

    get selectedElement() {
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
     * This can be used to display markers of individual CMMNElementViews and their sub views.
     * 
     * @param {CaseFileItemDef|undefined} definition 
     */
    updateSelectedCaseFileItemDefinition(definition) {
        this.items.forEach(item => item.marker.refresh(definition));
    }

    showHaloAndResizer(e) {
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
        const currentlyVisibleHalo = this.items.find(item => item != this.case.casePlanModel && item.halo.visible);

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
     * @param {*} e 
     * @param {CMMNElementView} self 
     * @returns {CMMNElementView}
     */
    getItemUnderMouse(e, self = undefined) {
        const itemsUnderMouse = this.items.filter(item => item.nearElement(e, 10));
        const parentsUnderMouse = itemsUnderMouse.filter(item => item.parent instanceof CMMNElementView).map(item => item.parent);

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
            this.shapeBox.setDropHandler(dragData => this.createCasePlan(CasePlanView, dragData.event), dragData => this.__canHaveAsChild(dragData.shapeType));
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
        this.rolesEditor.delete();
        this.cfiEditor.delete();
        this.caseParametersEditor.delete();
        this.startCaseEditor.delete();
        this.sourceEditor.delete();
        this.deployForm.delete();
        this.splitter.delete();
        this.items.forEach(canvasItem => canvasItem.deletePropertiesView());
        Util.removeHTML(this.html);
    };

    /**
     * Returns description of the element type
     * @returns {String}
     */
    get typeDescription() {
        return 'CaseView';
    };

    //!!!! return true when the graph/background can have an element with elementType as parent
    __canHaveAsChild(elementType) {
        return elementType == CasePlanView && !this.casePlanModel;
    }

    /**
     * Returns the coordinates of the mouse pointer, relative with respect to the top left of the case canvas
     * @param {*} e 
     */
    getCursorCoordinates(e) {
        const x = e.clientX;
        const y = e.clientY;
        if (!x || !y) {
            console.error('Fetching cursor coordinates without a proper event... ', e);
            return;
        }

        const offset = this.svg.offset();
        return {
            x: e.clientX - offset.left,
            y: e.clientY - offset.top
        };
    }

    /**
     * Creates a case plan model (if that is the expected type)
     * @param {Function} cmmnType 
     * @param {*} e 
     */
    createCasePlan(cmmnType, e) {
        if (cmmnType == CasePlanView) {
            const coor = this.getCursorCoordinates(e);
            this.casePlanModel = CasePlanView.create(this, coor.x, coor.y);
            this.__addElement(this.casePlanModel);
            this.casePlanModel.propertiesView.show(true);
            return this.casePlanModel;
        } else {
            throw new Error('Cannot create an element of type ' + cmmnType.name + ' at the top of a case');
        }
    }

    /**
     * Add an element to the drawing canvas.
     * @param {CMMNElementView|CaseFileItemView|TextAnnotationView} cmmnElement 
     */
    __addElement(cmmnElement) {
        // Only add the element if we're not loading the entire case. Because then all elements are presented to the joint graphs in one shot.
        if (this.loading) {
            return;
        }

        this.graph.addCells([cmmnElement.xyz_joint]);

        // TODO: this should no longer be necessary if constructors fill proper joint immediately based upon definition
        cmmnElement.refreshView();
        // TODO: figure out when to properly apply the move constraint logic
        cmmnElement.__moveConstraint(cmmnElement.shape.x, cmmnElement.shape.y);

        this.editor.completeUserAction();

        // Also refresh the properties visible in the case view
        this.refreshMovableViews();

        return cmmnElement;
    }

    /**
     * Add a connector to the canvas
     * @param {Connector} connector 
     */
    __addConnector(connector) {
        this.connectors.push(connector);
        if (!this.loading) {
            this.graph.addCells([connector.xyz_joint]);
        }
    }

    /**
     * Remove a connector from the registration. This method is invoked when the connector
     * is already removed from the canvas.
     * @param {Connector} connector 
     */
    __removeConnector(connector) {
        connector.edge.removeDefinition();
        Util.removeFromArray(this.connectors, connector);
    }

    /**
     * Remove an element from the canvas, including it's children.
     * @param {CMMNElementView} cmmnElement 
     */
    __removeElement(cmmnElement) {
        // if (cmmnElement instanceof PlanningTableView) return; // Cannot delete planning table images.

        // Remove it; which recursively also removes the children; only then save it.
        cmmnElement.__delete();

        // And save the changes.
        this.editor.completeUserAction();

        //update the column UsedIn in the case file items treetable
        this.cfiEditor.showUsedIn();

        // Also refresh the properties visible in the case view
        this.refreshMovableViews();
    }

    /**
     * Finds the CMMNElementView with the specified ID or undefined.
     * @param {String} id 
     * @returns {CMMNElementView}
     */
    getItem(id) {
        return this.items.find(item => id && item.id == id);
    }

    /**
     * returns a case file item element referencing the caseFileItemID
     * @param {String} caseFileItemID 
     */
    getCaseFileItemElement(caseFileItemID) {
        return this.items.find(item => item.isCaseFileItem && item.definition.id == caseFileItemID);
    }

    switchLabels() {
        this.diagram.connectorStyle.shiftRight();
        this.editor.ide.info(this.diagram.connectorStyle.infoMessage, 8000);
        this.items.filter(item => item.isCriterion).forEach(sentry => sentry.updateConnectorLabels());
        this.editor.saveModel();
    }
}
