import EventListenerDefinition from "../../../../repository/definition/cmmn/caseplan/eventlistenerdefinition";
import ShapeDefinition from "../../../../repository/definition/dimensions/shape";
import PlanItemHalo from "./halo/cmmn/planitemhalo";
import PlanItemView from "./planitemview";
import StageView from "./stageview";

export default abstract class EventListenerView<ED extends EventListenerDefinition> extends PlanItemView<ED> {
    /**
     * Creates a new EventListenerView
     */
    constructor(parent: StageView, definition: ED, shape: ShapeDefinition) {
        super(parent.case, parent, definition, shape);
        // define default color
        this.__resizable = false;
    }

    createHalo() {
        return new PlanItemHalo(this);
    }

    get markup(): string {
        return `<image x="0" y="0" width="32px" height="32px" xlink:href="${this.imageURL}" />
                <text class="cmmn-text" x="16" y="50" text-anchor="middle" />`;
    }

    /**
     * Returns the image URL for the event listener.
     */
    get imageURL(): string {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    get isEventListener(): boolean {
        return true;
    }
}
