import PlanItemView from "../../planitemview";
import DecoratorBox from "../decoratorbox";
import RuleDecorator from "./rule";

export const REQUIRED_IMG = 'images/requireddecorator_32.png';

export default class RequiredRuleDecorator extends RuleDecorator {
    /**
     * @param {DecoratorBox} box 
     * @param {PlanItemView} view 
     */
    constructor(box, view) {
        super(box, view, REQUIRED_IMG, 'requiredRule');
    }
}
