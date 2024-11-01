import StageView from "../../stageview";
import ManualActivationRuleDecorator from "../items/manualactivationrule";
import RepetitionRuleDecorator from "../items/repetitionrule";
import RequiredRuleDecorator from "../items/requiredrule";
import DecoratorBox from "../decoratorbox";
import MinusDecorator from "../items/minus";
import AutoCompleteDecorator from "../items/autocomplete";

export default class StageDecoratorBox extends DecoratorBox {
    /**
     * @param {StageView} view 
     */
    constructor(view) {
        super(view);
        this.view = view;
        this.decorators = [
            new ManualActivationRuleDecorator(this, view),
            new RequiredRuleDecorator(this, view),
            new MinusDecorator(this, view),
            new AutoCompleteDecorator(this, view),
            new RepetitionRuleDecorator(this, view)
        ];
    }
}
