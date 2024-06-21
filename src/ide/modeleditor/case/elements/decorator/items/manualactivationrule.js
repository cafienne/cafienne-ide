import PlanItemView from "../../planitemview";
import DecoratorBox from "../decoratorbox";
import RuleDecorator from "./rule";

const MANUALACTIVATION_IMG = 'images/manualactivationdecorator_32.png';

export default class ManualActivationRuleDecorator extends RuleDecorator {
    /**
     * @param {DecoratorBox} box 
     * @param {PlanItemView} view 
     */
    constructor(box, view) {
        super(box, view, MANUALACTIVATION_IMG, 'manualActivationRule');
    }
}
