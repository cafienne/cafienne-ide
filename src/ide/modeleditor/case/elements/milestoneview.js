import MilestoneDefinition from "../../../../repository/definition/cmmn/caseplan/milestonedefinition";
import PlanItem from "../../../../repository/definition/cmmn/caseplan/planitem";
import ShapeDefinition from "../../../../repository/definition/dimensions/shape";
import MilestoneDecoratorBox from "./decorator/box/milestonedecoratorbox";
import PlanItemView from "./planitemview";
import MilestoneProperties from "./properties/milestoneproperties";
import StageView from "./stageview";

export default class MilestoneView extends PlanItemView {
    /**
     * 
     * @param {StageView} stage 
     * @param {*} x 
     * @param {*} y 
     */
    static create(stage, x, y) {
        const definition = stage.planItemDefinition.createPlanItem(MilestoneDefinition);
        const shape = stage.case.diagram.createShape(x, y, 100, 40, definition.id);
        return new MilestoneView(stage, definition, definition.definition, shape);
    }

    /**
     * Creates a new MilestoneView element.
     * @param {StageView} parent 
     * @param {PlanItem} definition
     * @param {MilestoneDefinition} planItemDefinition 
     * @param {ShapeDefinition} shape 
     */
    constructor(parent, definition, planItemDefinition, shape) {
        super(parent.case, parent, definition, shape);
        this.planItemDefinition = planItemDefinition;
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
        return criterionType == EntryCriterionView.name;
    }

    get isMilestone() {
        return true;
    }
}
