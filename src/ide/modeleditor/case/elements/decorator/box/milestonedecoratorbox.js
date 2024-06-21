import DecoratorBox from "../decoratorbox";
import RepetitionRuleDecorator from "../items/repetitionrule";
import RequiredRuleDecorator from "../items/requiredrule";

export default class MilestoneDecoratorBox extends DecoratorBox {
    /**
     * @param {MilestoneView} view 
     */
    constructor(view) {
        super(view);
        this.view = view;
        this.decorators = [
            new RequiredRuleDecorator(this, view),
            new RepetitionRuleDecorator(this, view)
        ];
    }
}