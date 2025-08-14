import MilestoneDefinition from "../../../../repository/definition/cmmn/caseplan/milestonedefinition";
import PlanItem from "../../../../repository/definition/cmmn/caseplan/planitem";
import StageDefinition from "../../../../repository/definition/cmmn/caseplan/stagedefinition";
import CaseTaskDefinition from "../../../../repository/definition/cmmn/caseplan/task/casetaskdefinition";
import HumanTaskDefinition from "../../../../repository/definition/cmmn/caseplan/task/humantaskdefinition";
import ProcessTaskDefinition from "../../../../repository/definition/cmmn/caseplan/task/processtaskdefinition";
import TimerEventDefinition from "../../../../repository/definition/cmmn/caseplan/timereventdefinition";
import UserEventDefinition from "../../../../repository/definition/cmmn/caseplan/usereventdefinition";
import ShapeDefinition from "../../../../repository/definition/dimensions/shape";
import CaseFile from "../../../../repository/serverfile/casefile";
import HumanTaskFile from "../../../../repository/serverfile/humantaskfile";
import ProcessFile from "../../../../repository/serverfile/processfile";
import Util from "../../../../util/util";
import CaseFileItemDragData from "../../../dragdrop/casefileitemdragdata";
import ServerFileDragData from "../../../dragdrop/serverfiledragdata";
import ElementView from "../../../editors/modelcanvas/elementview";
import CaseCanvas from "./casecanvas";
import CaseElementView from "./caseelementview";
import CaseFileItemView from "./casefileitemview";
import CaseTaskView from "./casetaskview";
import StageDecoratorBox from "./decorator/box/stagedecoratorbox";
import PlanItemHalo from "./halo/cmmn/planitemhalo";
import HumanTaskView from "./humantaskview";
import MilestoneView from "./milestoneview";
import PlanItemView from "./planitemview";
import ProcessTaskView from "./processtaskview";
import StageProperties from "./properties/stageproperties";
import TaskStageView from "./taskstageview";
import TaskView from "./taskview";
import TextAnnotationView from "./textannotationview";
import TimerEventView from "./timereventview";
import UserEventView from "./usereventview";

export default class StageView<SD extends StageDefinition = StageDefinition> extends TaskStageView<SD> {
    static create(stage: StageView, x: number, y: number): StageView {
        const definition = stage.definition.createPlanItem(StageDefinition);
        const shape = stage.case.diagram.createShape(x, y, 420, 140, definition.id);
        return new StageView(stage.case, stage, definition, shape);
    }

    constructor(cs: CaseCanvas, parent: CaseElementView | undefined, definition: SD, shape: ShapeDefinition) {
        super(cs, parent, definition, shape);
        this.definition.planItems.forEach(planItem => this.addPlanItem(planItem));
    }

    setDropHandlers() {
        super.setDropHandlers();
        // allow for dropping tasks directly from repository browser ...
        this.case.editor.ide.repositoryBrowser.setDropHandler(dragData => this.addTaskModel(dragData), dragData => dragData.file instanceof CaseFile || dragData.file instanceof HumanTaskFile || dragData.file instanceof ProcessFile);
        // ... and case file items to be dropped from the cfiEditor
        this.case.cfiEditor.setDropHandler(dragData => this.addCaseFileItem(dragData));
    }

    removeDropHandlers() {
        super.removeDropHandlers();
        this.case.editor.ide.repositoryBrowser.removeDropHandler();
        this.case.cfiEditor.removeDropHandler();
    }

    /**
     * Add a 'drag-dropped' case file item
     */
    addCaseFileItem(dragData: CaseFileItemDragData) {
        const evt: JQuery<PointerEvent> | undefined = dragData.event;
        if (!evt) {
            console.warn('No event provided for CaseFileItemDragData');
            return;
        }

        const coor = this.case.getCursorCoordinates(evt);
        this.__addChildElement(CaseFileItemView.create(this, coor.x, coor.y, dragData.item));
    }

    /**
     * Add a 'drag-dropped' task implementation
     */
    addTaskModel(dragData: ServerFileDragData) {
        const shapeType = () => {
            if (dragData.file instanceof CaseFile) return CaseTaskView;
            if (dragData.file instanceof HumanTaskFile) return HumanTaskView;
            if (dragData.file instanceof ProcessFile) return ProcessTaskView;
        };
        const viewType = shapeType();
        if (viewType) {
            const element = super.addElementView(viewType, dragData.event) as TaskView;
            element.changeTaskImplementation(dragData.file, true);
        }
    }

    /**
     * If a stage is moved, then it may be moved onto other plan items.
     * If that is the case, these items will change their parent to this stage.
     * Alternatively, if a stage is resized to a smaller size, items may fall out, and then get a new parent.
     */
    resetChildren() {
        const currentChildren = this.__childElements;
        // Only other plan items, case file items and textboxes can move in/out of us. Not planning tables or sentries.
        const allCaseItems = this.case.items.filter(item => !item.isPlanningTable && !item.isCriterion);
        // Create a collection of items we surround visually, but only the "top-level", not their children.
        const visuallySurroundedItems = allCaseItems.filter(item => this.surrounds(item) && !this.surrounds(item.parent));
        // Former children: those that are currently a descendant, but that we no longer surround visually.
        //  Note: if "we" are the CasePlanView, then we surround also children that are outside our borders, as we are the top level element.
        //  So in that case - formerChildren will ALWAYS be empty, leaving it save to have an exclamation mark in line 105 on parent being not undefined
        const formerChildren = allCaseItems.filter(item => currentChildren.indexOf(item) >= 0 && visuallySurroundedItems.indexOf(item) < 0);
        // New children: those that are currently not a descendant, but that we now surround visually.
        const newChildren = allCaseItems.filter(item => currentChildren.indexOf(item) < 0 && visuallySurroundedItems.indexOf(item) >= 0);
        formerChildren.forEach(child => child.changeParent(this.parent!));
        newChildren.forEach(child => child.changeParent(this));
    }

    /**
     * Determines whether this stage visually surrounds the cmmn element.
     */
    surrounds(other: CaseElementView | undefined) {
        // Note: this method is added here instead of directly invoking shape.surrounds because logic is different at caseplan level, so caseplan can override.
        return other && this.shape.surrounds(other.shape);
    }

    resized() {
        super.resized();
        this.resetChildren();
    }

    moved(x: number, y: number, newParent: CaseElementView) {
        super.moved(x, y, newParent);
        this.resetChildren();
    }

    createProperties(): StageProperties<any> {
        return new StageProperties(this);
    }

    createDecoratorBox() {
        return new StageDecoratorBox(this);
    }

    createHalo(): PlanItemHalo<SD, StageView<SD>> {
        return new PlanItemHalo(this);
    }

    get __planningTablePosition() {
        return { x: 50, y: -9 };
    }

    addPlanItem(definition: PlanItem) {
        // Only add the new plan item if we do not yet visualize it
        if (!this.__childElements.find(planItemView => planItemView.definition.id == definition.id)) {
            // Check whether we can find a shape for the definition.
            const shape = this.case.diagram.getShape(definition);
            if (!shape) {
                console.warn(`Error: missing shape definition for ${definition.constructor.name} named "${definition.name}" with id "${definition.id}"`);
                return;
            }
            // Add a view based on the definition with its shape
            return this.__addChildElement(this.createPlanItemView(definition, shape));
        }
    }

    /**
     * Creates a new view based on the plan item,
     */
    createPlanItemView(definition: PlanItem, shape: ShapeDefinition) {
        if (definition instanceof HumanTaskDefinition) {
            return new HumanTaskView(this, definition, shape);
        } else if (definition instanceof CaseTaskDefinition) {
            return new CaseTaskView(this, definition, shape);
        } else if (definition instanceof ProcessTaskDefinition) {
            return new ProcessTaskView(this, definition, shape);
        } else if (definition instanceof StageDefinition) {
            return new StageView(this.case, this, definition, shape);
        } else if (definition instanceof MilestoneDefinition) {
            return new MilestoneView(this, definition, shape);
        } else if (definition instanceof UserEventDefinition) {
            return new UserEventView(this, definition, shape);
        } else if (definition instanceof TimerEventDefinition) {
            return new TimerEventView(this, definition, shape);
        } else {
            throw new Error('This type of plan item cannot be instantiated into a view ' + definition.name);
        }
    }

    /**
     * Method invoked when a child is moved into this element from a different parent.
     */
    adoptItem(childElement: CaseElementView) {
        const previousParent = childElement.parent;
        super.adoptItem(childElement);
        if (childElement.isPlanItem) {
            // then also move the definition
            const childPlanItemView = childElement as PlanItemView;
            childPlanItemView.definition.switchParent(this.definition);
            // If the item is discretionary, we may also have to clean up the former planning table and refresh ours.
            if (childPlanItemView.definition.isDiscretionary && previousParent && previousParent instanceof StageView) {
                previousParent.cleanupPlanningTableIfPossible();
                this.showPlanningTable();
            }
        }
    }

    cleanupPlanningTableIfPossible() {
        if (this.planningTableView) {
            if (this.planningTableView.definition.tableItems.length == 0) {
                this.planningTableView.__delete();
                return;
            }
        }
    }

    /**
     * Adds a discretionary item definition (that is, a PlanItem with .isDiscretionary set to true)
     */
    addDiscretionaryItem(definition: PlanItem) {
        this.addPlanItem(definition);
    }

    createChildView(viewType: Function, x: number, y: number): ElementView<any> {
        if (Util.isSubClassOf(PlanItemView, viewType)) {
            return this.__addChildElement((viewType as any).create(this, x, y));
        } else if (viewType == CaseFileItemView) {
            return this.__addChildElement(CaseFileItemView.create(this, x, y));
        } else if (viewType == TextAnnotationView) {
            return this.__addChildElement(TextAnnotationView.create(this, x, y));
        } else { // Could (should?) be sentry
            return super.createChildView(viewType, x, y);
        }
    }

    get markup() {
        return `<g @selector='scalable'>
                    <polygon @selector='body' points="20,0 0,20 0,280 20,300 480,300 500,280 500,20 480,0" />
                </g>
                <text @selector="label" />
                ${this.decoratorBox.markup}`;
    }

    get markupAttributes(): any {
        return {
            label: {
                fontWeight: 'bold',
                'ref': 'body',
                'ref-x': .5,
                'ref-y': 8,
                'x-alignment': 'middle',
                'y-alignment': 'top'
            }
        };
    }

    /**
     * returns true when an element of type 'elementType' can be added as a child to this element
     */
    __canHaveAsChild(elementType: Function) {
        if (this.canHaveCriterion(elementType) ||
            elementType == HumanTaskView ||
            elementType == CaseTaskView ||
            elementType == ProcessTaskView ||
            elementType == MilestoneView ||
            elementType == UserEventView ||
            elementType == TimerEventView ||
            elementType == CaseFileItemView ||
            elementType == StageView ||
            elementType == TextAnnotationView) {
            return true;
        }
        return false;
    }

    get isStage() {
        return true;
    }
}
