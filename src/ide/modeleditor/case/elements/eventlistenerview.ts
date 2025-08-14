import EventListenerDefinition from "../../../../repository/definition/cmmn/caseplan/eventlistenerdefinition";
import ShapeDefinition from "../../../../repository/definition/dimensions/shape";
import PlanItemHalo from "./halo/cmmn/planitemhalo";
import PlanItemView from "./planitemview";
import StageView from "./stageview";

export default abstract class EventListenerView<ED extends EventListenerDefinition> extends PlanItemView<ED> {
    /**
     * Creates a new EventListenerView
     */
    constructor(public parent: StageView, definition: ED, shape: ShapeDefinition) {
        super(parent.canvas, parent, definition, shape);
        this.__resizable = false;
    }

    createHalo() {
        return new PlanItemHalo(this);
    }

    get markup() {
        return `<image @selector='body' x="0" y="0" width="32px" height="32px" href="${this.imageURL}" />
                <text @selector='label' x="16" y="50" text-anchor='middle'/>`;
    }

    get markupAttributes() {
        return {
            label: {
                textVerticalAnchor: 'top',
                y: 'calc(h+8)',
            }
        };
    }

    /**
     * Returns the image URL for the event listener.
     */
    abstract get imageURL(): string;

    get isEventListener() {
        return true;
    }
}
