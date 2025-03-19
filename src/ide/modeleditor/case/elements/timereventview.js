import TimerEventDefinition from "../../../../repository/definition/cmmn/caseplan/timereventdefinition";
import ShapeDefinition from "../../../../repository/definition/dimensions/shape";
import Shapes from "../../../util/images/shapes";
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
        const definition = stage.definition.createPlanItem(TimerEventDefinition);
        const shape = stage.case.diagram.createShape(x, y, 32, 32, definition.id);
        return new TimerEventView(stage, definition, shape);
    }

    /**
     * Creates a new TimerEventView element.
     * @param {StageView} parent 
     * @param {TimerEventDefinition} definition 
     * @param {ShapeDefinition} shape 
     */
    constructor(parent, definition, shape) {
        super(parent, definition, shape);
        this.definition = definition;
    }

    createProperties() {
        return new TimerEventProperties(this);
    }

    get imageURL() {
        return Shapes.TimerEvent;       
    }

    referencesDefinitionElement(definitionId) {
        const cfiTrigger = this.definition.caseFileItemStartTrigger;
        if (cfiTrigger && cfiTrigger.sourceRef == definitionId) {
            return true;
        }
        return super.referencesDefinitionElement(definitionId);
    }

    get isTimerEvent() {
        return true;
    }
}
