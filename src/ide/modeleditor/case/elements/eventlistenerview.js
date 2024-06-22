import PlanItem from "@definition/cmmn/caseplan/planitem";
import ShapeDefinition from "@definition/dimensions/shape";
import PlanItemView from "./planitemview";

export default class EventListenerView extends PlanItemView {
    /**
     * Creates a new EventListenerView
     * @param {StageView} parent 
     * @param {PlanItem} definition
     * @param {ShapeDefinition} shape 
     */
    constructor(parent, definition, shape) {
        super(parent.case, parent, definition, shape);
        //define default color
        this.__resizable = false;
    }

    get markup() {
        return `<image x="0" y="0" width="32px" height="32px" xlink:href="${this.imageURL}" />
                <text class="cmmn-text" x="16" y="50" text-anchor="middle" />`;
    }

    /**
     * @returns {String}
     */
    get imageURL() {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    get isEventListener() {
        return true;
    }
}
