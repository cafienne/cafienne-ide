import CaseDefinition from "@repository/definition/cmmn/casedefinition";
import ParameterMappingDefinition from "@repository/definition/cmmn/contract/parametermappingdefinition";
import CafienneImplementationDefinition from "../../../../extensions/cafienneimplementationdefinition";
import HumanTaskDefinition from "../humantaskdefinition";
import AssignmentDefinition from "./assignmentdefinition";
import DueDateDefinition from "./duedatedefinition";
import ValidationContext from "@repository/validate/validation";

export default class CafienneWorkflowDefinition extends CafienneImplementationDefinition<CaseDefinition> {
    humanTaskRef: string;
    validatorRef: string;
    mappings: ParameterMappingDefinition[];
    assignment?: AssignmentDefinition;
    dueDate?: DueDateDefinition;
    constructor(importNode: Element, caseDefinition: CaseDefinition, public task: HumanTaskDefinition) {
        super(importNode, caseDefinition, task);
        this.humanTaskRef = this.parseAttribute('humanTaskRef');
        this.validatorRef = this.parseAttribute('validatorRef');
        this.mappings = this.parseElements('parameterMapping', ParameterMappingDefinition);
        this.assignment = this.parseElement((AssignmentDefinition as any).TAG, AssignmentDefinition);
        this.dueDate = this.parseElement((DueDateDefinition as any).TAG, DueDateDefinition);
    }

    get inputs() {
        return this.task.inputs;
    }

    createExportNode(parentNode: Element) {
        if (this.mappings.length > 0 || this.humanTaskRef || this.assignment || this.dueDate || this.validatorRef) {
            super.createExtensionNode(parentNode, (CafienneImplementationDefinition as any).TAG, 'humanTaskRef', 'validatorRef', 'mappings', 'assignment', 'dueDate')
        }
    }
    validate(validationContext: ValidationContext) {
        super.validate(validationContext);

        var eleemntName = this.parent?.name ?? '';
        // due date
        if (this.dueDate) {
            const dueDate = this.dueDate;
            if (!dueDate.body) {
                this.raiseError('The due date of task "-par0-" has no due date expression', 
                    [eleemntName]);
            }
            if (!dueDate.contextRef && dueDate.body !== 'true' && dueDate.body !== 'false') {
                this.raiseWarning('The due date of task "-par0-" has no context (case file item)',
                    [eleemntName]);
            }
        }

        // assignment
        if (this.assignment) {
            const assignment = this.assignment;
            if (!assignment.body) {
                this.raiseError('The dynamic assignment of task "-par0-" has no due date expression', 
                    [eleemntName]);
            }
            if (!assignment.contextRef && assignment.body !== 'true' && assignment.body !== 'false') {
                this.raiseWarning('The dynamic assignment of task "-par0-" has no context (case file item)',
                    [eleemntName]);
            }
        }

        // 4-eyes
        // rendex-vous
    }
}
