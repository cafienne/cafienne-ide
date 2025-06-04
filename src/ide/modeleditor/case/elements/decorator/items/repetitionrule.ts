import Images from "../../../../../util/images/images";
import PlanItemView from "../../planitemview";
import DecoratorBox from "../decoratorbox";
import RuleDecorator from "./rule";

export default class RepetitionRuleDecorator extends RuleDecorator {
    /**
     * @param {DecoratorBox} box 
     * @param {PlanItemView} view 
     */
    constructor(box: DecoratorBox, view: PlanItemView) {
        super(box, view, Images.Repetition, 'repetitionRule');
    }

    get rule() {
        return this.view.definition.itemControl.repetitionRule;
    }
}
