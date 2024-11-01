import MilestoneDefinition from "@definition/cmmn/caseplan/milestonedefinition";
import ShapeDefinition from "@definition/dimensions/shape";
import MilestoneDecoratorBox from "./decorator/box/milestonedecoratorbox";
import PlanItemView from "./planitemview";
import MilestoneProperties from "./properties/milestoneproperties";
import { EntryCriterionView } from "./sentryview";
import StageView from "./stageview";

export default class MilestoneView extends PlanItemView {
    /**
     * 
     * @param {StageView} stage 
     * @param {*} x 
     * @param {*} y 
     */
    static create(stage, x, y) {
        const definition = stage.definition.createPlanItem(MilestoneDefinition);
        const shape = stage.case.diagram.createShape(x, y, 100, 40, definition.id);
        return new MilestoneView(stage, definition, shape);
    }

    /**
     * Creates a new MilestoneView element.
     * @param {StageView} parent 
     * @param {MilestoneDefinition} definition
     * @param {ShapeDefinition} shape 
     */
    constructor(parent, definition, shape) {
        super(parent.case, parent, definition, shape);
        this.definition = definition;
    }

    get wrapText() {
        return true;
    }

    createProperties() {
        return new MilestoneProperties(this);
    }

    createDecoratorBox() {
        return new MilestoneDecoratorBox(this);
    }

    get markup() {
        return `<g class="scalable">
                    <rect class="cmmn-shape cmmn-border cmmn-milestone-shape" rx="20" ry="20" width="100" height="40" />
                </g>
                <text class="cmmn-text" />
                ${this.decoratorBox.markup}`;
    }

    get textAttributes() {
        return {
            'text': {
                ref: '.cmmn-shape',
                'ref-x': .5,
                'ref-y': .5,
                'y-alignment': 'middle',
                'x-alignment': 'middle'
            }
        };
    }

    /**
     * returns true when an element of type 'elementType' can be added as a child to this element
     * @param {String} elementType 
     */
    __canHaveAsChild(elementType) {
        return this.canHaveCriterion(elementType);
    }

    /**
     * 
     * @param {String} criterionType 
     * @returns 
     */
    canHaveCriterion(criterionType) {
        return criterionType == EntryCriterionView;
    }

    get isMilestone() {
        return true;
    }
}
