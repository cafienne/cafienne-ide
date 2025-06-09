import EventListenerDefinition from "../../../../repository/definition/cmmn/caseplan/eventlistenerdefinition";
import ShapeDefinition from "../../../../repository/definition/dimensions/shape";
import PlanItemView from "./planitemview";
import StageView from "./stageview";

export default abstract class EventListenerView<ED extends EventListenerDefinition> extends PlanItemView<ED> {
    /**
     * Creates a new EventListenerView
     */
    constructor(public parent: StageView, definition: ED, shape: ShapeDefinition) {
        super(parent.case, parent, definition, shape);
        this.__resizable = false;
    }

    get markup() {
        return `<image x="0" y="0" width="32px" height="32px" xlink:href="${this.imageURL}" />
                <text class="cmmn-text" x="16" y="50" text-anchor="middle" />`;
    }

    /**
     * Returns the image URL for the event listener.
     */
    abstract get imageURL(): string;

    get isEventListener() {
        return true;
    }
}
