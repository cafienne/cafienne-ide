import MilestoneDefinition from "@definition/cmmn/caseplan/milestonedefinition";
import PlanItem from "@definition/cmmn/caseplan/planitem";
import StageDefinition from "@definition/cmmn/caseplan/stagedefinition";
import CaseTaskDefinition from "@definition/cmmn/caseplan/task/casetaskdefinition";
import HumanTaskDefinition from "@definition/cmmn/caseplan/task/humantaskdefinition";
import ProcessTaskDefinition from "@definition/cmmn/caseplan/task/processtaskdefinition";
import TimerEventDefinition from "@definition/cmmn/caseplan/timereventdefinition";
import UserEventDefinition from "@definition/cmmn/caseplan/usereventdefinition";
import ShapeDefinition from "@definition/dimensions/shape";
import CaseFileItemDragData from "@ide/dragdrop/casefileitemdragdata";
import ServerFileDragData from "@ide/dragdrop/serverfiledragdata";
import Util from "@util/util";
import CaseFileItemView from "./casefileitemview";
import CaseTaskView from "./casetaskview";
import CaseView from "./caseview";
import CMMNElementView from "./cmmnelementview";
import StageDecoratorBox from "./decorator/box/stagedecoratorbox";
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
import HumanTaskFile from "@repository/serverfile/humantaskfile";
import ProcessFile from "@repository/serverfile/processfile";
import CaseFile from "@repository/serverfile/casefile";

export default class StageView extends TaskStageView {
    /**
     * 
     * @param {StageView} stage 
     * @param {*} x 
     * @param {*} y 
     */
    static create(stage, x, y) {
        const definition = stage.definition.createPlanItem(StageDefinition);
        const shape = stage.case.diagram.createShape(x, y, 420, 140, definition.id);
        return new StageView(stage.case, stage, definition, shape);
    }

    /**
     * Creates a new StageView element.
     * @param {CaseView} cs 
     * @param {CMMNElementView} parent 
     * @param {StageDefinition} definition 
     * @param {ShapeDefinition} shape 
     */
    constructor(cs, parent, definition, shape) {
        super(cs, parent, definition, shape);
        this.definition = definition;
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
     * @param {CaseFileItemDragData} dragData 
     */
    addCaseFileItem(dragData) {
        const coor = this.case.getCursorCoordinates(dragData.event);
        this.__addCMMNChild(CaseFileItemView.create(this, coor.x, coor.y, dragData.item));
    }

    /**
     * Add a 'drag-dropped' task implementation
     * @param {ServerFileDragData} dragData 
     */
    addTaskModel(dragData) {
        const shapeType = () => {
            if (dragData.file instanceof CaseFile) return CaseTaskView;
            if (dragData.file instanceof HumanTaskFile) return HumanTaskView;
            if (dragData.file instanceof ProcessFile) return ProcessTaskView;
        }
        const viewType = shapeType();
        if (viewType) {
            /** @type {TaskView} */
            const element = super.addElementView(viewType, dragData.event);
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
        const formerChildren = allCaseItems.filter(item => currentChildren.indexOf(item) >= 0 && visuallySurroundedItems.indexOf(item) < 0);
        // New children: those that are currently not a descendant, but that we now surround visually.
        const newChildren = allCaseItems.filter(item => currentChildren.indexOf(item) < 0 && visuallySurroundedItems.indexOf(item) >= 0);
        formerChildren.forEach(child => child.changeParent(this.parent));
        newChildren.forEach(child => child.changeParent(this));
    }

    /**
     * Determines whether this stage visually surrounds the cmmn element.
     * @param {CMMNElementView} other 
     */
    surrounds(other) {
        // Note: this method is added here instead of directly invoking shape.surrounds because logic is different at caseplan level, so caseplan can override.
        return this.shape.surrounds(other.shape);
    }

    moved(x, y, newParent) {
        super.moved(x, y, newParent);
        this.resetChildren();
    }

    createProperties() {
        return new StageProperties(this);
    }

    createDecoratorBox() {
        return new StageDecoratorBox(this);
    }

    get __planningTablePosition() {
        return { x: 50, y: -9 };
    }

    /**
     * 
     * @param {PlanItem} definition 
     */
    addPlanItem(definition) {
        if (!definition) {
            // there is no planitemdefinition for the planitem...
            console.warn('Plan item has NO definition and will be skipped', definition);
            return;
        }
        // Only add the new plan item if we do not yet visualize it
        if (!this.__childElements.find(planItemView => planItemView.definition.id == definition.id)) {
            return this.__addCMMNChild(this.createPlanItemView(definition));
        }
    }

    /**
     * Creates a new view based on the plan item,
     * @param {PlanItem} definition 
     */
    createPlanItemView(definition) {
        const shape = this.case.diagram.getShape(definition);
        if (!shape) {
            console.warn(`Error: missing shape definition for ${definition.constructor.name} named "${definition.name}" with id "${definition.id}"`)
            return;
        }

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
     * @param {CMMNElementView} childElement 
     */
    adoptItem(childElement) {
        const previousParent = childElement.parent;
        super.adoptItem(childElement);
        if (childElement.isPlanItem) {
            // then also move the definition
            childElement.definition.switchParent(this.definition);
            // If the item is discretionary, we may also have to clean up the former planning table and refresh ours.
            if (childElement.definition.isDiscretionary && previousParent && previousParent.isStage) {
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
     * @param {PlanItem} definition 
     */
    addDiscretionaryItem(definition) {
        this.addPlanItem(definition);
    }

    createCMMNChild(viewType, x, y) {
        if (Util.isSubClassOf(PlanItemView, viewType)) {
            return this.__addCMMNChild(viewType.create(this, x, y));
        } else if (viewType == CaseFileItemView) {
            return this.__addCMMNChild(CaseFileItemView.create(this, x, y));
        } else if (viewType == TextAnnotationView) {
            return this.__addCMMNChild(TextAnnotationView.create(this, x, y));
        } else { // Could (should?) be sentry
            return super.createCMMNChild(viewType, x, y);
        }
    }

    get markup() {
        return `<g class="scalable">
                    <polyline class="cmmn-shape cmmn-border cmmn-stage-shape" points=" 20,0 0,20 0,280 20,300 480,300 500,280 500,20 480,0 20,0" />
                </g>
                <text class="cmmn-bold-text" font-size="12" />
                ${this.decoratorBox.markup}`;
    }

    get textAttributes() {
        return {
            'text': {
                'ref': '.cmmn-shape',
                'ref-x': .5,
                'ref-y': 8,
                'x-alignment': 'middle',
                'y-alignment': 'top'
            }
        };
    }

    /**
     * returns true when an element of type 'elementType' can be added as a child to this element
     * @param {*} elementType 
     */
    __canHaveAsChild(elementType) {
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
