import PlanItemView from "../../planitemview";
import Decorator from "../decorator";
import DecoratorBox from "../decoratorbox";

export default class RuleDecorator extends Decorator {
    /**
     * @param {DecoratorBox} box 
     * @param {PlanItemView} view 
     */
    constructor(box, view, img, ruleName) {
        super(box, view, img);
        this.ruleName = ruleName;
    }

    get rule() {
        return this.view.definition.itemControl[this.ruleName];
    }

    get visibility() {
        return this.rule;
    }

    get tooltip() {
        const rule = this.rule;
        if (! rule) {
            return '';
        }
        // Make rule name uppercase
        const ruleDescription = this.ruleName[0].toUpperCase() + this.ruleName.slice(1);
        return this.rule.createTooltip(ruleDescription);
    }
}
