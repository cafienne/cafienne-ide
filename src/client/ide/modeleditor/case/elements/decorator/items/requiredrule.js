import Images from "@util/images/images";
import PlanItemView from "../../planitemview";
import DecoratorBox from "../decoratorbox";
import RuleDecorator from "./rule";

export default class RequiredRuleDecorator extends RuleDecorator {
    /**
     * @param {DecoratorBox} box 
     * @param {PlanItemView} view 
     */
    constructor(box, view) {
        super(box, view, Images.Required, 'requiredRule');
    }
}
