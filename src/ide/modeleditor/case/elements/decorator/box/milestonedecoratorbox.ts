import MilestoneView from "../../milestoneview";
import DecoratorBox from "../decoratorbox";
import RepetitionRuleDecorator from "../items/repetitionrule";
import RequiredRuleDecorator from "../items/requiredrule";

export default class MilestoneDecoratorBox extends DecoratorBox {
    constructor(view: MilestoneView) {
        super(view);
        this.decorators = [
            new RequiredRuleDecorator(this, view),
            new RepetitionRuleDecorator(this, view)
        ];
    }
}
