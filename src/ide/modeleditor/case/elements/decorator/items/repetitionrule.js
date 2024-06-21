import PlanItemView from "../../planitemview";
import DecoratorBox from "../decoratorbox";
import RuleDecorator from "./rule";

const REPETITION_IMG = 'images/repetitiondecorator_32.png';

export default class RepetitionRuleDecorator extends RuleDecorator {
    /**
     * @param {DecoratorBox} box 
     * @param {PlanItemView} view 
     */
    constructor(box, view) {
        super(box, view, REPETITION_IMG, 'repetitionRule');
    }
}
