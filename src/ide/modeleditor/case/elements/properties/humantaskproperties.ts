import Images from "../../../../util/images/images";
import HumanTaskView from "../humantaskview";
import TaskProperties from "./taskproperties";

export default class HumanTaskProperties extends TaskProperties<HumanTaskView> {
    renderData() {
        this.addNameField();
        this.addSeparator();
        this.addDocumentationField();
        this.addSeparator();
        this.addModelImplementation();
        this.addParameterMappings();
        this.addValidatorField();
        this.addSeparator();
        this.addRepeatRuleBlock();
        this.addRequiredRuleBlock();
        this.addManualActivationRuleBlock();
        this.addSeparator();
        this.addIsBlocking();
        this.addDiscretionaryBlock(Images.DiscretionaryTask, 'Discretionary Task');
        this.addSeparator();
        this.addPlanningTableField();
        this.addIdField();
    }
}
