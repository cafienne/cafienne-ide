import MilestoneView from "../milestoneview";
import PlanItemProperties from "./planitemproperties";

export default class MilestoneProperties extends PlanItemProperties<MilestoneView> {
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
