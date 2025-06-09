import ServerFile from "../../../../../repository/serverfile/serverfile";
import Util from "../../../../../util/util";
import { Element } from "../../../../../util/xml";
import Validator from "../../../../validate/validator";
import ParameterDefinition from "../../../contract/parameterdefinition";
import ParameterizedModelDefinition from "../../../parameterizedmodeldefinition";
import ExternalReference from "../../../references/externalreference";
import CaseDefinition from "../../casedefinition";
import InputMappingDefinition from "../../contract/inputmappingdefinition";
import OutputMappingDefinition from "../../contract/outputmappingdefinition";
import ParameterMappingDefinition from "../../contract/parametermappingdefinition";
import StageDefinition from "../stagedefinition";
import TaskStageDefinition from "../taskstagedefinition";
import TaskParameterDefinition from "./taskparameterdefinition";

export default abstract class TaskDefinition extends TaskStageDefinition {
    isBlocking: boolean = true;
    inputs: TaskParameterDefinition[];
    outputs: TaskParameterDefinition[];
    private _mappings: ParameterMappingDefinition[];

    constructor(importNode: Element, caseDefinition: CaseDefinition, public parent: StageDefinition) {
        super(importNode, caseDefinition, parent);
        this.isBlocking = this.parseBooleanAttribute('isBlocking', true);
        this.inputs = this.parseElements('inputs', TaskParameterDefinition);
        this.outputs = this.parseElements('outputs', TaskParameterDefinition);
        this._mappings = this.parseElements('parameterMapping', ParameterMappingDefinition);
    }

    validate(validator: Validator): void {
        super.validate(validator);
        if (!this.isBlocking) {
            if (this.exitCriteria.length > 0) {
                validator.raiseError(this, `${this} is non blocking. It may not have exit criteria (found ${this.exitCriteria.length})`);
            }

            if (this.outputs.length > 0) {
                validator.raiseError(this, `${this} is non blocking. It may not have output parameters (found ${this.outputs.length})`);
            }

            if (this.planningTable !== undefined) {
                validator.raiseError(this, `${this} is non blocking. It may not have a planning table`);
            }
        }

        // TODO: Check mappings
    }

    validateImplementation(validator: Validator) {
        if (this.implementationReference.isEmpty) {
            validator.raiseError(this, `${this} misses a reference to an implementation`);
        } else if (this.implementationReference.getDefinition() === undefined) {
            validator.raiseError(this, `${this} refers to an implementation called '${this.implementationRef}' but that file does not exist`);
        }
    }

    get mappings(): ParameterMappingDefinition[] {
        return this._mappings;
    }

    resolvedExternalReferences() {
        this.bindImplementation();
    }

    get implementationReference(): ExternalReference<ParameterizedModelDefinition> {
        throw new Error('Method must be implemented in ' + this.constructor.name);
    }

    /**
     * @returns {Function}
     */
    get implementationClass(): Function {
        throw new Error('Method must be implemented in ' + this.constructor.name);
    }

    get isTask() {
        return true;
    }

    get implementationRef(): string {
        return this.implementationReference.value;
    }

    get implementationModel() {
        return this.implementationReference.getDefinition();
    }

    get validatorRef(): string {
        throw new Error('Method must be implemented in ' + this.constructor.name);
    }

    set validatorRef(ref: string) {
        throw new Error('Method must be implemented in ' + this.constructor.name);
    }

    get inputMappings() {
        return this.mappings.filter(mapping => mapping.isInputMapping);
    }

    get outputMappings() {
        // Source == undefined means: the mapping has as target a parameter of this task, and the source comes from the task's implementation (hence is not in our definition)
        return this.mappings.filter(mapping => !mapping.isInputMapping);
    }

    /**
     * Returns the type of task, e.g. CaseTask or ProcessTask or HumanTask (can be used for e.g. console logging)
     */
    get type() {
        return this.constructor.name.substring(0, this.constructor.name.length - 'Definition'.length);
    }

    /**
     * Checks whether an input parameter with the given name exists, and, if not,
     * creates a new one with the specified name.
     */
    getInputParameterWithName(name: string) {
        return this.getParameterWithName(name, this.inputs);
    }

    /**
     * Checks whether an input parameter with the given name exists, and, if so,
     * creates a new one with the specified name plus a separator plus a number.
     */
    createInputParameterWithName(name: string) {
        const newParameter: TaskParameterDefinition = this.createDefinition(TaskParameterDefinition, undefined, this.generateUniqueParameterName(name, this.inputs));
        this.inputs.push(newParameter);
        return newParameter;
    }

    /**
     * Checks whether an output parameter with the given name exists, and, if so,
     * creates a new one with the specified name plus a separator plus a number.
     */
    createOutputParameterWithName(name: string) {
        const newParameter: TaskParameterDefinition = this.createDefinition(TaskParameterDefinition, undefined, this.generateUniqueOutputParameterName(name));
        this.outputs.push(newParameter);
        return newParameter;
    }

    /**
     * Generate a name for a task output parameter that is unique according to the pattern
     * - 'Response' ---> (there is no other parameter with the name response)
     * - 'Response.1' ---> the second one generated
     * - 'Response.2' ---> the third one
     * If in the meantime 'Response.1' is deleted or has a new name, then the fourth one will get that "free spot"
     */
    generateUniqueOutputParameterName(name: string) {
        return this.generateUniqueParameterName(name, this.outputs);
    }

    /**
     * Generate a name for a task parameter that is unique according to the pattern
     * - 'Response' ---> (there is no other parameter with the name response)
     * - 'Response.1' ---> the second one generated
     * - 'Response.2' ---> the third one
     * If in the meantime 'Response.1' is deleted or has a new name, then the fourth one will get that "free spot"
     */
    generateUniqueParameterName(name: string, siblings: TaskParameterDefinition[]) {
        const separator = '.';
        if (!siblings.find(p => p.name == name)) return name;
        let counter = 1;
        while (siblings.find(p => p.name == name + separator + counter) !== undefined) counter++;
        return name + separator + counter;
    }

    getParameterWithName(name: string, collection: TaskParameterDefinition[]): TaskParameterDefinition {
        const existingParameter = collection.find(p => p.name == name);
        if (!existingParameter) {
            const newParameter: TaskParameterDefinition = this.createDefinition(TaskParameterDefinition, undefined, name);
            collection.push(newParameter);
            return newParameter;
        } else {
            return existingParameter;
        }
    }

    /**
     * Creates a new mapping and fills some properties if they are specified
     */
    createMapping<M extends ParameterMappingDefinition>(creator: Function, sourceRef?: string, targetRef?: string, taskParameter?: TaskParameterDefinition, implementationParameter?: ParameterDefinition): M {
        const newMapping: ParameterMappingDefinition = this.createDefinition(creator);
        newMapping.name = ''; // mappings have no name, so remove the one that is generated by default
        this.mappings.push(newMapping);
        newMapping.sourceRef = sourceRef || '';
        newMapping.targetRef = targetRef || '';
        if (taskParameter) newMapping.taskParameter = taskParameter;
        newMapping.implementationParameter = implementationParameter;

        return <M>newMapping;
    }

    createInputMapping(implementationParameter: ParameterDefinition): InputMappingDefinition {
        const targetRef = implementationParameter.getIdentifier();
        return this.createMapping(InputMappingDefinition, '', targetRef, undefined, implementationParameter);
    }

    createOutputMapping(implementationParameter: ParameterDefinition): OutputMappingDefinition {
        const sourceRef = implementationParameter.getIdentifier();
        return this.createMapping(OutputMappingDefinition, sourceRef, '', undefined, implementationParameter);
    }

    /**
     * Generates new mappings and task input/output parameters based on the
     * given xml node that represents the contract of the task implementation.
     */
    changeTaskImplementation(file: ServerFile<ParameterizedModelDefinition>) {
        const implementationRef = file.fileName;
        const implementationModel = file.definition;

        if (this.implementationRef !== implementationRef) {
            console.log(this + " changes implementation (current is " + this.implementationRef + ", new is " + implementationRef + ")");
        }
        // First remove existing mappings and parameters.
        Util.clearArray(this.mappings);
        this.inputs = [];
        this.outputs = [];
        this.implementationReference.update(file.fileName);
        if (!this.implementationModel) return;

        // Generate new task input and output parameters and mappings
        //  for each of the input and output parameters of the contract
        this.implementationModel.inputParameters.forEach((parameter: ParameterDefinition) => this.createInputMapping(parameter));
        this.implementationModel.outputParameters.forEach((parameter: ParameterDefinition) => this.createOutputMapping(parameter));
    }

    /**
     * Sets the task implementation, and optionally updates the implementationRef.
     */
    bindImplementation() {
        if (!this.implementationModel) {
            return;
        }
        const implementationModel = this.implementationModel;
        this.inputMappings.forEach(mapping => {
            if (mapping.targetRef) {
                // Note: if the input parameter cannot be found in the implementation model, the targetRef will be cleared from the mapping
                mapping.implementationParameter = implementationModel.findInputParameter(mapping.targetRef);
            }
        });

        // Now iterate all implementation's input parameters and check for unused ones. For those we will generate new, default mappings.
        this.implementationModel.inputParameters.forEach((parameter: ParameterDefinition) => {
            const existingMapping = this.inputMappings.find(mapping => parameter.hasIdentifier(mapping.targetRef));
            if (!existingMapping) {
                // console.log('Generating default input mapping for implementation parameter ' + parameter.name + ' in task "' + this.name + '"');
                this.createInputMapping(parameter);
            }
        });

        this.outputMappings.forEach(mapping => {
            if (mapping.sourceRef) {
                mapping.implementationParameter = implementationModel.findOutputParameter(mapping.sourceRef);
            }
        });

        // Now iterate all task output parameters and check for unused ones. For those we will generate a mapping, in order to have them directly visible in the UI.
        // It also has no sense to have unused output parameters.
        this.implementationModel.outputParameters.forEach((parameter: ParameterDefinition) => {
            const existingMapping = this.outputMappings.find(mapping => parameter && parameter.hasIdentifier(mapping.sourceRef));
            if (!existingMapping) {
                // console.log('Generating default output mapping for implementation parameter ' + parameter.name + ' in task "' + this.name + '"');
                this.createOutputMapping(parameter);
            }
        });
    }

    createExportNode(parentNode: Element, tagName: string, ...propertyNames: any[]) {
        super.createExportNode(parentNode, tagName, 'isBlocking', 'inputs', 'outputs', propertyNames);
    }
}
