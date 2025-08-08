import CMMNElementDefinition from "../../../../repository/definition/cmmnelementdefinition";
import ShapeDefinition from "../../../../repository/definition/dimensions/shape";
import ElementView from "../../../editors/graphical/view/elementview";
import CaseView from "./caseview";

export default abstract class CMMNElementView<D extends CMMNElementDefinition = CMMNElementDefinition> extends ElementView<D, CaseView> {
    /**
     * Creates a new CMMNElementView within the case having the corresponding definition and x, y coordinates
     */
    constructor(cs: CaseView, parent: CMMNElementView | undefined, definition: D, shape: ShapeDefinition) {
        super(cs, parent, definition, shape);
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
    createCriterionAndConnect(criterionType: Function, sourceElement: CMMNElementView, e: JQuery.Event) {
        // Create a new criterion and add the source as an on part
        (this.addElementView(criterionType, e) as CMMNElementView).adoptOnPart(sourceElement);
    }

    /**
     * Hook for sentries to override.
     */
    adoptOnPart(sourceElement: CMMNElementView) { }

    /**
     * Hook for sentries to override.
     */
    updateConnectorLabels() { }

    get isPlanItem() {
        return false;
    }

    get isTask() {
        return false;
    }

    get isTaskOrStage() {
        return false;
    }

    get isMilestone() {
        return false;
    }

    get isEventListener() {
        return false;
    }

    get isUserEvent() {
        return false;
    }

    get isTimerEvent() {
        return false;
    }

    get isStage() {
        return false;
    }

    get isCasePlan() {
        return false;
    }

    get isCaseTask() {
        return false;
    }

    get isProcessTask() {
        return false;
    }

    get isHumanTask() {
        return false;
    }

    get isCriterion() {
        return false;
    }

    get isEntryCriterion() {
        return false;
    }

    get isExitCriterion() {
        return false;
    }

    get isReactivateCriterion() {
        return false;
    }

    get isPlanningTable() {
        return false;
    }

    get isCaseFileItem() {
        return false;
    }

    get isTextAnnotation() {
        return false;
    }
}
