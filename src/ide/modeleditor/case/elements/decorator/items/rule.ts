import ItemControlRuleDefinition from "../../../../../../repository/definition/cmmn/caseplan/itemcontrol/itemcontrolruledefinition";
import PlanItemView from "../../planitemview";
import Decorator from "../decorator";
import DecoratorBox from "../decoratorbox";

export default abstract class RuleDecorator extends Decorator {
    constructor(box: DecoratorBox, view: PlanItemView, img: string, private ruleName: string) {
        super(box, view, img);
    }

    abstract get rule(): ItemControlRuleDefinition | undefined;
    
    get visibility() {
        return this.rule !== undefined;
    }

    get tooltip() {
        const rule = this.rule;
        if (!rule) {
            return '';
        }
        // Make rule name uppercase
        const ruleDescription = this.ruleName[0].toUpperCase() + this.ruleName.slice(1);
        return rule.createTooltip(ruleDescription);
    }
}
