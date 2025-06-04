import StageView from "../../stageview";
import DecoratorBox from "../decoratorbox";
import AutoCompleteDecorator from "../items/autocomplete";
import ManualActivationRuleDecorator from "../items/manualactivationrule";
import MinusDecorator from "../items/minus";
import RepetitionRuleDecorator from "../items/repetitionrule";
import RequiredRuleDecorator from "../items/requiredrule";

export default class StageDecoratorBox extends DecoratorBox {
    constructor(view: StageView) {
        super(view);
        this.decorators = [
            new ManualActivationRuleDecorator(this, view),
            new RequiredRuleDecorator(this, view),
            new MinusDecorator(this, view),
            new AutoCompleteDecorator(this, view),
            new RepetitionRuleDecorator(this, view)
        ];
    }
}
