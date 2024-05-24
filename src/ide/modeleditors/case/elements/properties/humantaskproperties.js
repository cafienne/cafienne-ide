import HumanTaskDefinition from "../../../../../repository/definition/cmmn/definitions/caseplan/task/humantaskdefinition";
import { DISCRETIONARYTASK_IMG } from "../elements";
import HumanTaskView from "../humantaskview";
import TaskProperties from "./taskproperties";

export default class HumanTaskProperties extends TaskProperties {
    /**
     * 
     * @param {HumanTaskView} task 
     */
    constructor(task) {
        super(task);
        this.cmmnElement = task;
        /** @type {HumanTaskDefinition} */
        this.humanTaskDefinition = this.cmmnElement.definition.definition;
    }

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
        this.addDiscretionaryBlock(DISCRETIONARYTASK_IMG, 'Discretionary Task');
        this.addSeparator();
        this.addPlanningTableField();
        this.addIdField();
    }
}
