import ParameterMappingDefinition from "@repository/definition/cmmn/contract/parametermappingdefinition";
import CafienneImplementationDefinition from "../../../../extensions/cafienneimplementationdefinition";
import ModelDefinition from "../../../../modeldefinition";
import HumanTaskDefinition from "../humantaskdefinition";
import AssignmentDefinition from "./assignmentdefinition";
import DueDateDefinition from "./duedatedefinition";

class CafienneWorkflowDefinition extends CafienneImplementationDefinition {
    /**
     * 
     * @param {Element} element 
     * @param {ModelDefinition} caseDefinition 
     * @param {HumanTaskDefinition} parent 
     */
    constructor(element, caseDefinition, parent) {
        super(element, caseDefinition, parent);
        this.task = parent;
        this.humanTaskRef = this.parseAttribute('humanTaskRef');
        this.validatorRef = this.parseAttribute('validatorRef');
        this.mappings = this.parseElements('parameterMapping', ParameterMappingDefinition);
        this.assignment = this.parseElement(AssignmentDefinition.TAG, AssignmentDefinition);
        this.dueDate = this.parseElement(DueDateDefinition.TAG, DueDateDefinition);
    }

    get inputs() {
        return this.task.inputs;
    }

    createExportNode(parentNode) {
        if (this.mappings.length > 0 || this.humanTaskRef || this.assignment || this.validatorRef) {
            super.createExtensionNode(parentNode, CafienneImplementationDefinition.TAG, 'humanTaskRef', 'validatorRef', 'mappings', 'assignment', 'dueDate')
        }
    }
}
