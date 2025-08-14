import { dia } from '@joint/core';
import $ from "jquery";
import TextAnnotationDefinition from "../../../../repository/definition/artifact/textannotation";
import CaseDefinition from "../../../../repository/definition/cmmn/casedefinition";
import CaseFileItemDef from "../../../../repository/definition/cmmn/casefile/casefileitemdef";
import CasePlanDefinition from "../../../../repository/definition/cmmn/caseplan/caseplandefinition";
import CMMNElementDefinition from "../../../../repository/definition/cmmnelementdefinition";
import Edge from '../../../../repository/definition/dimensions/edge';
import ShapeDefinition from "../../../../repository/definition/dimensions/shape";
import Validator from "../../../../repository/validate/validator";
import Debugger from "../../../debugger/debugger";
import DragData from "../../../dragdrop/dragdata";
import Connector from '../../../editors/modelcanvas/connector/connector';
import ModelCanvas from '../../../editors/modelcanvas/modelcanvas';
import ShapeBox from "../../../editors/modelcanvas/shapebox/shapebox";
import UndoManager from '../../../editors/modelcanvas/undoredo/undomanager';
import ValidateForm from "../../../editors/validate/validateform";
import RightSplitter from "../../../splitter/rightsplitter";
import CaseModelEditor from "../casemodeleditor";
import CaseSourceEditor from "../editors/casesourceeditor";
import DeployForm from "../editors/deployform";
import CaseFileEditor from "../editors/file/casefileeditor";
import CaseParametersEditor from "../editors/parameters/caseparameterseditor";
import StartCaseEditor from "../editors/startcaseeditor";
import CaseTeamEditor from "../editors/team/caseteameditor";
import CaseElementRegistry from '../shapebox/caseelementregistry';
import CaseElementView from "./caseelementview";
import CaseFileItemView from "./casefileitemview";
import CasePlanView from "./caseplanview";
import CaseConnector from "./connector/caseconnector";
import StageView from "./stageview";
import TextAnnotationView from "./textannotationview";

export default class CaseCanvas extends ModelCanvas<CaseDefinition, CMMNElementDefinition, CaseElementView> {
    readonly divCFIEditor: JQuery<HTMLElement>;
    readonly definition: CasePlanDefinition;
    readonly deployForm: DeployForm;
    readonly sourceEditor: CaseSourceEditor;
    readonly cfiEditor: CaseFileEditor;
    casePlanModel?: CasePlanView;
    readonly teamEditor: CaseTeamEditor;
    readonly caseParametersEditor: CaseParametersEditor;
    readonly startCaseEditor: StartCaseEditor;
    readonly debugEditor: Debugger;
    readonly validateForm: ValidateForm;
    readonly typeDescription = 'Case';
    readonly splitter: RightSplitter;

    constructor(public editor: CaseModelEditor, public htmlParent: JQuery<HTMLElement>, public caseDefinition: CaseDefinition, undoManager: UndoManager) {
        const now = new Date();
        super(editor, htmlParent, caseDefinition, undoManager);

        this.editor.canvas = this;
        this.definition = caseDefinition.casePlan;

        this.divCaseModel.append($('<div class="divCaseFileContainer" />'));
        this.divCFIEditor = this.html.find('.divCaseFileContainer');

        this.deployForm = new DeployForm(this);
        this.sourceEditor = new CaseSourceEditor(editor, this.html);
        this.cfiEditor = new CaseFileEditor(this, this.divCFIEditor);
        this.splitter = new RightSplitter(this.divCaseModel, '60%', 5);

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

    createShapeBox(htmlElement: JQuery<HTMLElement>): ShapeBox {
        return new ShapeBox(this as any, new CaseElementRegistry(), htmlElement);
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
                    parent.__addChildElement(new CaseFileItemView(parent, definitionElement, shape));
                } else if (definitionElement instanceof TextAnnotationDefinition) {
                    parent.__addChildElement(new TextAnnotationView(parent, definitionElement, shape));
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
        const validator = new Validator(this.caseDefinition).run();
        this.validateForm.loadRemarks(validator);
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

    setDropHandlers() {
        super.setDropHandlers();

        if (!this.casePlanModel) {
            this.shapeBox.setDropHandler(dragData => this.createCasePlan(dragData.event), dragData => this.__canHaveAsChild(dragData.shapeType));
        }
    }

    removeDropHandlers() {
        this.shapeBox.removeDropHandler();

        super.removeDropHandlers();
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

        super.delete();
    }

    __canHaveAsChild(elementType: Function) {
        return elementType == CasePlanView && !this.casePlanModel;
    }

    createCasePlan(e: JQuery<PointerEvent>) {
        const coor = this.getCursorCoordinates(e);
        this.casePlanModel = CasePlanView.createNew(this, coor.x, coor.y);
        this.__addElement(this.casePlanModel);
        this.casePlanModel.propertiesView.show(true);
        return this.casePlanModel;
    }

    __createConnector(source: CaseElementView, target: CaseElementView, edge: Edge): Connector {
        return new CaseConnector(source, target, edge);
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
