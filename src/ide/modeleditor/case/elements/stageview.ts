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

export default class StageView<SD extends StageDefinition = StageDefinition> extends TaskStageView<SD> {
    static create(stage: StageView | CaseView, x: number, y: number): StageView {
        const definition = stage.definition.createPlanItem(StageDefinition);
        const shape = stage.case.diagram.createShape(x, y, 420, 140, definition.id);
        return new StageView(stage.case, stage instanceof StageView ? stage : undefined, definition, shape);
    }

    constructor(cs: CaseView, parent: CMMNElementView | undefined, definition: SD, shape: ShapeDefinition) {
        super(cs, parent, definition, shape);
        this.definition.planItems.forEach(planItem => this.addPlanItem(planItem));
    }

    setDropHandlers() {
        super.setDropHandlers();
        this.case.editor.ide.repositoryBrowser.setDropHandler(
            (dragData: ServerFileDragData) => this.addTaskModel(dragData),
            (dragData: ServerFileDragData) =>
                dragData.file instanceof CaseFile ||
                dragData.file instanceof HumanTaskFile ||
                dragData.file instanceof ProcessFile
        );
        this.case.cfiEditor.setDropHandler((dragData: CaseFileItemDragData) => this.addCaseFileItem(dragData));
    }

    removeDropHandlers() {
        super.removeDropHandlers();
        this.case.editor.ide.repositoryBrowser.removeDropHandler();
        this.case.cfiEditor.removeDropHandler();
    }

    addCaseFileItem(dragData: CaseFileItemDragData) {
        const evt: JQuery<PointerEvent> | undefined = dragData.event;
        if (!evt) {
            console.warn('No event provided for CaseFileItemDragData');
            return;
        }

        const coor = this.case.getCursorCoordinates(evt);
        this.__addCMMNChild(CaseFileItemView.create(this, coor.x, coor.y, dragData.item));
    }

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

    resetChildren() {
        const currentChildren = this.__childElements;
        const allCaseItems = this.case.items.filter(item => !item.isPlanningTable && !item.isCriterion);
        const visuallySurroundedItems = allCaseItems.filter(item => this.surrounds(item) && item.parent instanceof CMMNElementView && !this.surrounds(item.parent));
        const formerChildren = allCaseItems.filter(item => currentChildren.indexOf(item) >= 0 && visuallySurroundedItems.indexOf(item) < 0);
        const newChildren = allCaseItems.filter(item => currentChildren.indexOf(item) < 0 && visuallySurroundedItems.indexOf(item) >= 0);
        formerChildren.forEach(child => child.changeParent(this.parent as StageView));
        newChildren.forEach(child => child.changeParent(this));
    }

    surrounds(other: CMMNElementView) {
        return this.shape.surrounds(other.shape);
    }

    resized() {
        super.resized();
        this.resetChildren();
    }

    moved(x: number, y: number, newParent: any) {
        super.moved(x, y, newParent);
        this.resetChildren();
    }

    createProperties(): StageProperties<any> {
        return new StageProperties(this);
    }

    createDecoratorBox() {
        return new StageDecoratorBox(this);
    }

    get __planningTablePosition() {
        return { x: 50, y: -9 };
    }

    addPlanItem(definition: PlanItem) {
        if (!definition) {
            console.warn('Plan item has NO definition and will be skipped', definition);
            return;
        }
        if (!this.__childElements.find(planItemView => planItemView.definition.id == definition.id)) {
            const view = this.createPlanItemView(definition);
            if (view) {
                return this.__addCMMNChild(view);
            }
        }
    }

    createPlanItemView(definition: PlanItem) {
        const shape = this.case.diagram.getShape(definition);
        if (!shape) {
            console.warn(`Error: missing shape definition for ${definition.constructor.name} named "${definition.name}" with id "${definition.id}"`);
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

    adoptItem(childElement: CMMNElementView) {
        const previousParent = childElement.parent;
        super.adoptItem(childElement);
        if (childElement.isPlanItem) {
            const childPlanItemView = childElement as PlanItemView;
            childPlanItemView.definition.switchParent(this.definition);
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

    addDiscretionaryItem(definition: PlanItem) {
        this.addPlanItem(definition);
    }

    createCMMNChild(viewType: any, x: number, y: number): CMMNElementView {
        if (Util.isSubClassOf(PlanItemView, viewType)) {
            return this.__addCMMNChild(viewType.create(this, x, y));
        } else if (viewType == CaseFileItemView) {
            return this.__addCMMNChild(CaseFileItemView.create(this, x, y));
        } else if (viewType == TextAnnotationView) {
            return this.__addCMMNChild(TextAnnotationView.create(this, x, y));
        } else {
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

    __canHaveAsChild(elementType: any) {
        if (
            this.canHaveCriterion(elementType) ||
            elementType == HumanTaskView ||
            elementType == CaseTaskView ||
            elementType == ProcessTaskView ||
            elementType == MilestoneView ||
            elementType == UserEventView ||
            elementType == TimerEventView ||
            elementType == CaseFileItemView ||
            elementType == StageView ||
            elementType == TextAnnotationView
        ) {
            return true;
        }
        return false;
    }

    get isStage() {
        return true;
    }
}
