import TaskView from "../../taskview";
import DecoratorBox from "../decoratorbox";
import ManualActivationRuleDecorator from "../items/manualactivationrule";
import RepetitionRuleDecorator from "../items/repetitionrule";
import RequiredRuleDecorator from "../items/requiredrule";

export class TaskDecoratorBox extends DecoratorBox {
    constructor(view: TaskView) {
        super(view);
        this.decorators = [
            new ManualActivationRuleDecorator(this, view),
            new RequiredRuleDecorator(this, view),
            new RepetitionRuleDecorator(this, view)
        ];
    }
}