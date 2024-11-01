import TaskView from "../../taskview";
import DecoratorBox from "../decoratorbox";
import ManualActivationRuleDecorator from "../items/manualactivationrule";
import RepetitionRuleDecorator from "../items/repetitionrule";
import RequiredRuleDecorator from "../items/requiredrule";

export class TaskDecoratorBox extends DecoratorBox {
    /**
     * @param {TaskView} view 
     */
    constructor(view) {
        super(view);
        this.view = view;
        this.decorators = [
            new ManualActivationRuleDecorator(this, view),
            new RequiredRuleDecorator(this, view),
            new RepetitionRuleDecorator(this, view)
        ];
    }
}