import PlanItem from "../../../../repository/definition/cmmn/definitions/caseplan/planitem";
import TimerEventDefinition from "../../../../repository/definition/cmmn/definitions/caseplan/timereventdefinition";
import ShapeDefinition from "../../../../repository/definition/cmmn/dimensions/shape";
import CMMNElementView from "./cmmnelementview";
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
        if (definition.definition instanceof TimerEventDefinition) {
            return new TimerEventView(stage, definition, definition.definition, shape);
        }
        console.error('Not supposed to reach this code');
    }

    /**
     * Creates a new TimerEventView element.
     * @param {CMMNElementView} parent 
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
}
CMMNElementView.registerType(TimerEventView, 'Timer Event', 'images/svg/timerevent.svg');
