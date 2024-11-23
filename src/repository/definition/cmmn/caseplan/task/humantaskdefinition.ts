import HumanTaskFile from "@repository/serverfile/humantaskfile";
import CaseDefinition from "../../casedefinition";
import ClassicCaseRoleDefinition from "../../caseteam/classiccaseroledefinition";
import StageDefinition from "../stagedefinition";
import TaskDefinition from "./taskdefinition";
import CafienneWorkflowDefinition from "./workflow/cafienneworkflowdefinition";

export default class HumanTaskDefinition extends TaskDefinition {
    performerRef: string;
    workflow: CafienneWorkflowDefinition;
    static get infix() {
        return 'ht';
    }

    constructor(importNode: Element, caseDefinition: CaseDefinition, public parent: StageDefinition) {
        super(importNode, caseDefinition, parent);
        this.performerRef = this.parseAttribute('performerRef');
        /** @type {CafienneWorkflowDefinition} */
        this.workflow = this.parseImplementation(CafienneWorkflowDefinition);
    }

    createExportNode(parentNode: Element) {
        super.createExportNode(parentNode, 'humanTask', 'planningTable', 'performerRef', 'workflow');
    }

    get performer(): ClassicCaseRoleDefinition | undefined {
        return <ClassicCaseRoleDefinition> this.caseDefinition.getElement(this.performerRef);
    }

    /**
     * @returns {String} The name of the role that is assigned as the performer of the task
     */
    get performerName() {
        const performer = this.caseDefinition.getElement(this.performerRef);
        return performer ? performer.name : '';
    }

    get implementationClass() {
        return HumanTaskFile;
    }

    get implementationRef() {
        return this.workflow.humanTaskRef.fileName;
    }

    set implementationRef(ref) {
        this.workflow.humanTaskRef.update(ref);
    }

    get mappings() {
        if (!this.workflow) {
            return [];
        }
        return this.workflow.mappings;
    }

    get dueDate() {
        return this.workflow.dueDate;
    }

    set dueDate(duedate) {
        this.workflow.dueDate = duedate;
    }

    get assignment() {
        return this.workflow.assignment;
    }

    set assignment(assignment) {
        this.workflow.assignment = assignment;
    }

    get validatorRef() {
        return this.workflow.validatorRef.fileName;
    }

    set validatorRef(ref) {
        this.workflow.validatorRef.update(ref);
    }
}
