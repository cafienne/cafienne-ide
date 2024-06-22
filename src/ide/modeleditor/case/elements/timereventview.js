import PlanItem from "@definition/cmmn/caseplan/planitem";
import TimerEventDefinition from "@definition/cmmn/caseplan/timereventdefinition";
import ShapeDefinition from "@definition/dimensions/shape";
import EventListenerView from "./eventlistenerview";
import TimerEventProperties from "./properties/timereventproperties";
import StageView from "./stageview";

export default class TimerEventView extends EventListenerView {
    /**
     * 
     * @param {StageView} stage 
     * @param {*} x 
     * @param {*} y 
     */
    static create(stage, x, y) {
        const definition = stage.planItemDefinition.createPlanItem(TimerEventDefinition);
        const shape = stage.case.diagram.createShape(x, y, 32, 32, definition.id);
        return new TimerEventView(stage, definition, definition.definition, shape);
    }

    /**
     * Creates a new TimerEventView element.
     * @param {StageView} parent 
     * @param {PlanItem} definition
     * @param {TimerEventDefinition} planItemDefinition 
     * @param {ShapeDefinition} shape 
     */
    constructor(parent, definition, planItemDefinition, shape) {
        super(parent, definition, shape);
        this.planItemDefinition = planItemDefinition;
    }

    createProperties() {
        return new TimerEventProperties(this);
    }

    get imageURL() {
        return 'images/svg/timerevent.svg';       
    }

    referencesDefinitionElement(definitionId) {
        const cfiTrigger = this.planItemDefinition.caseFileItemStartTrigger;
        if (cfiTrigger && cfiTrigger.sourceRef == definitionId) {
            return true;
        }
        return super.referencesDefinitionElement(definitionId);
    }

    get isTimerEvent() {
        return true;
    }
}
