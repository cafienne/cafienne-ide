import ModelDefinition from "../../../../../modeldefinition";
import CafienneImplementationDefinition from "../../../extensions/cafienneimplementationdefinition";
import HumanTaskDefinition from "../humantaskdefinition";

export default class CafienneWorkflowDefinition extends CafienneImplementationDefinition {
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
