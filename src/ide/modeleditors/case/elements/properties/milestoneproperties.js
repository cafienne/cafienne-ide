import PlanItemProperties from "./planitemproperties";

export default class MilestoneProperties extends PlanItemProperties {
    renderData() {
        this.addNameField();
        this.addSeparator();
        this.addDocumentationField();
        this.addSeparator();
        this.addRepeatRuleBlock();
        this.addRequiredRuleBlock();
        this.addIdField();
    }
}