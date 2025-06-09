import TimerEventDefinition from "../../../../repository/definition/cmmn/caseplan/timereventdefinition";
import ShapeDefinition from "../../../../repository/definition/dimensions/shape";
import Images from "../../../util/images/images";
import EventListenerView from "./eventlistenerview";
import TimerEventProperties from "./properties/timereventproperties";
import StageView from "./stageview";

export default class TimerEventView extends EventListenerView<TimerEventDefinition> {
    /**
     * Create a new TimerEventView at the given coordinates.
     */
    static create(stage: StageView, x: number, y: number): TimerEventView {
        const definition = stage.definition.createPlanItem(TimerEventDefinition);
        const shape = stage.case.diagram.createShape(x, y, 32, 32, definition.id);
        return new TimerEventView(stage, definition, shape);
    }

    /**
     * Creates a new TimerEventView element.
     */
    constructor(parent: StageView, definition: TimerEventDefinition, shape: ShapeDefinition) {
        super(parent, definition, shape);
    }

    createProperties() {
        return new TimerEventProperties(this);
    }

    get imageURL() {
        return Images.TimerEvent;
    }

    referencesDefinitionElement(definitionId: string) {
        const cfiTrigger = this.definition.caseFileItemStartTrigger;
        if (cfiTrigger && cfiTrigger.sourceRef.references(definitionId)) {
            return true;
        }
        return super.referencesDefinitionElement(definitionId);
    }

    get isTimerEvent() {
        return true;
    }
}
