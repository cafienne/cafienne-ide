import MilestoneDefinition from "../../../../repository/definition/cmmn/caseplan/milestonedefinition";
import ShapeDefinition from "../../../../repository/definition/dimensions/shape";
import MilestoneDecoratorBox from "./decorator/box/milestonedecoratorbox";
import EntryCriterionView from "./entrycriterionview";
import PlanItemHalo from "./halo/cmmn/planitemhalo";
import PlanItemView from "./planitemview";
import MilestoneProperties from "./properties/milestoneproperties";
import StageView from "./stageview";

export default class MilestoneView extends PlanItemView<MilestoneDefinition> {
    /**
     * Create a new MilestoneView at the given coordinates.
     */
    static create(stage: StageView, x: number, y: number): MilestoneView {
        const definition = stage.definition.createPlanItem(MilestoneDefinition);
        const shape = stage.case.diagram.createShape(x, y, 100, 40, definition.id);
        return new MilestoneView(stage, definition, shape);
    }

    /**
     * Creates a new MilestoneView element.
     */
    constructor(public parent: StageView, definition: MilestoneDefinition, shape: ShapeDefinition) {
        super(parent.case, parent, definition, shape);
    }

    get wrapText() {
        return true;
    }

    createProperties() {
        return new MilestoneProperties(this);
    }

    createHalo() {
        return new PlanItemHalo(this);
    }

    createDecoratorBox() {
        return new MilestoneDecoratorBox(this);
    }

    get markup() {
        return `<g @selector='scalable'>
                    <rect @selector='body' rx="20" ry="20" width="100" height="40" />
                </g>
                <text @selector='label' />
                ${this.decoratorBox.markup}`;
    }

    get markupAttributes() {
        return {
            body: {
                fill: 'rgb(156, 175, 226)',
            },
            label: {
                ref: 'body',
                'ref-x': .5,
                'ref-y': .5,
                'y-alignment': 'middle',
                'x-alignment': 'middle'
            }
        };
    }

    /**
     * Returns true when an element of type 'elementType' can be added as a child to this element
     */
    __canHaveAsChild(elementType: Function) {
        return this.canHaveCriterion(elementType);
    }

    /**
     * Returns true if the criterionType can be added to this milestone
     */
    canHaveCriterion(criterionType: Function) {
        return criterionType == EntryCriterionView;
    }

    get isMilestone() {
        return true;
    }
}
