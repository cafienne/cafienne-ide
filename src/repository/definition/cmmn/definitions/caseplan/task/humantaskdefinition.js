import CaseRoleDefinition from "../../caseteam/caseroledefinition";
import TaskDefinition from "./taskdefinition";
import AssignmentDefinition from "./workflow/assignmentdefinition";
import CafienneWorkflowDefinition from "./workflow/cafienneworkflowdefinition";
import DueDateDefinition from "./workflow/duedatedefinition";

export default class HumanTaskDefinition extends TaskDefinition {
    static get prefix() {
        return 'ht';
    }

    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
        this.performerRef = this.parseAttribute('performerRef');
        /** @type {CafienneWorkflowDefinition} */
        this.workflow = this.parseImplementation(CafienneWorkflowDefinition);
    }

    createExportNode(parentNode) {
        super.createExportNode(parentNode, 'humanTask', 'planningTable', 'performerRef', 'workflow');
    }

    /**
     * @returns {CaseRoleDefinition}
     */
    get performer() {
        return this.caseDefinition.getElement(this.performerRef);
    }

    /**
     * @returns {String} The name of the role that is assigned as the performer of the task
     */
    get performerName() {
        const performer = this.caseDefinition.getElement(this.performerRef);
        return performer ? performer.name : '';
    }

    /**
     * @returns {String}
     */
    get implementationRef() {
        return this.workflow.humanTaskRef;
    }

    set implementationRef(ref) {
        this.workflow.humanTaskRef = ref;
    }

    get mappings() {
        if (!this.workflow) {
            return [];
        }
        return this.workflow.mappings;
    }

    /**
     * @returns {DueDateDefinition}
     */
    get dueDate() {
        return this.workflow.dueDate;
    }

    set dueDate(duedate) {
        this.workflow.dueDate = duedate;
    }

    /**
     * @returns {AssignmentDefinition}
     */
    get assignment() {
        return this.workflow.assignment;
    }

    set assignment(assignment) {
        this.workflow.assignment = assignment;
    }

    /**
     * @returns {String}
     */
    get validatorRef() {
        return this.workflow.validatorRef;
    }

    set validatorRef(ref) {
        this.workflow.validatorRef = ref;
    }
}
