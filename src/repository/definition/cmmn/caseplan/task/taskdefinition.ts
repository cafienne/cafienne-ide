import ModelDefinition from "@repository/definition/modeldefinition";
import Util from "@util/util";
import ParameterDefinition from "../../../contract/parameterdefinition";
import CaseDefinition from "../../casedefinition";
import InputMappingDefinition from "../../contract/inputmappingdefinition";
import OutputMappingDefinition from "../../contract/outputmappingdefinition";
import ParameterMappingDefinition from "../../contract/parametermappingdefinition";
import { TaskStageDefinition } from "../planitem";
import StageDefinition from "../stagedefinition";
import TaskParameterDefinition from "./taskparameterdefinition";
import ValidationContext from "@repository/validate/validation";

export default class TaskDefinition extends TaskStageDefinition {
    isBlocking: boolean = true;
    inputs: TaskParameterDefinition[];
    outputs: TaskParameterDefinition[];
    private _implementationModel?: ModelDefinition;
    private _mappings: ParameterMappingDefinition[];
    hasImplementation: boolean = false;

    constructor(importNode: Element, caseDefinition: CaseDefinition, public parent: StageDefinition) {
        super(importNode, caseDefinition, parent);
        this.isBlocking = this.parseBooleanAttribute('isBlocking', true);
        this.inputs = this.parseElements('inputs', TaskParameterDefinition);
        this.outputs = this.parseElements('outputs', TaskParameterDefinition);
        this._mappings = this.parseElements('parameterMapping', ParameterMappingDefinition);
    }

    get mappings(): ParameterMappingDefinition[] {
        return this._mappings;
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
        throw new Error('Method must be implemented in ' + this.constructor.name);
    }

    set implementationRef(ref) {
        throw new Error('Method must be implemented in ' + this.constructor.name);
    }

    get implementationModel() {
        return this._implementationModel;
    }

    set implementationModel(taskImplementation) {
        this._implementationModel = taskImplementation;
    }

    hasExternalReferences() {
        return this.implementationRef !== undefined && this.implementationRef !== '';
    }

    async loadExternalReferences() {
        return this.resolveExternalDefinition(this.implementationRef).then(definition => { this.setImplementation(this.implementationRef, definition) });
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
    createMapping<M extends ParameterMappingDefinition>(creator: Function, sourceRef?: string, targetRef?: string, taskParameter?: TaskParameterDefinition, implementationParameter?: ParameterDefinition<ModelDefinition>): M {
        const newMapping: ParameterMappingDefinition = this.createDefinition(creator);
        newMapping.name = ''; // mappings have no name, so remove the one that is generated by default
        this.mappings.push(newMapping);
        newMapping.sourceRef = sourceRef || '';
        newMapping.targetRef = targetRef || '';
        if (taskParameter) newMapping.taskParameter = taskParameter;
        newMapping.implementationParameter = implementationParameter;

        return <M>newMapping;
    }

    createInputMapping(implementationParameter: ParameterDefinition<ModelDefinition>): InputMappingDefinition {
        const targetRef = implementationParameter.getIdentifier();
        return this.createMapping(InputMappingDefinition, '', targetRef, undefined, implementationParameter);
    }

    createOutputMapping(implementationParameter: ParameterDefinition<ModelDefinition>): OutputMappingDefinition {
        const sourceRef = implementationParameter.getIdentifier();
        return this.createMapping(OutputMappingDefinition, sourceRef, '', undefined, implementationParameter);
    }

    /**
     * Generates new mappings and task input/output parameters based on the
     * given xml node that represents the contract of the task implementation.
     */
    changeTaskImplementation(implementationRef: string, implementationModel: ModelDefinition) {
        console.log("Associating new implementation ref (current is " + this.implementationRef + ", new is " + implementationRef + ")");
        // First remove existing mappings and parameters.
        Util.clearArray(this.mappings);
        this.inputs = [];
        this.outputs = [];
        this.implementationRef = implementationRef;
        this.implementationModel = implementationModel;

        // Generate new task input and output parameters and mappings
        //  for each of the input and output parameters of the contract
        this.implementationModel.inputParameters.forEach((parameter: ParameterDefinition<ModelDefinition>) => this.createInputMapping(parameter));
        this.implementationModel.outputParameters.forEach((parameter: ParameterDefinition<ModelDefinition>) => this.createOutputMapping(parameter));
    }

    /**
     * Sets the task implementation, and optionally updates the implementationRef.
     */
    setImplementation(implementationRef: string, implementationModel: ModelDefinition) {
        this.hasImplementation = true;
        this.implementationModel = implementationModel;

        if (this.implementationRef !== implementationRef) {
            this.changeTaskImplementation(implementationRef, implementationModel);
        } else {
            this.inputMappings.forEach(mapping => {
                if (mapping.targetRef) {
                    // Note: if the input parameter cannot be found in the implementation model, the targetRef will be cleared from the mapping
                    mapping.implementationParameter = implementationModel.findInputParameter(mapping.targetRef);
                }
            });

            // Now iterate all implementation's input parameters and check for unused ones. For those we will generate new, default mappings.
            this.implementationModel.inputParameters.forEach((parameter: ParameterDefinition<ModelDefinition>) => {
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
            this.implementationModel.outputParameters.forEach((parameter: ParameterDefinition<ModelDefinition>) => {
                const existingMapping = this.outputMappings.find(mapping => parameter && parameter.hasIdentifier(mapping.sourceRef));
                if (!existingMapping) {
                    // console.log('Generating default output mapping for implementation parameter ' + parameter.name + ' in task "' + this.name + '"');
                    this.createOutputMapping(parameter);
                }
            });
        }
    }

    createExportNode(parentNode: Element, tagName: string, ...propertyNames: any[]) {
        super.createExportNode(parentNode, tagName, 'isBlocking', 'inputs', 'outputs', propertyNames);
    }

    validate(validationContext: ValidationContext) {
        super.validate(validationContext);

        if (!this.implementationRef || this.implementationRef === "") {
            this.raiseWarning('No implementation attached to task "-par0-"', 
                [this.name]);
        }

        if (this.isBlocking == false) {
            //non blocking task cannot have exit sentries
            if (this.exitCriteria.length > 0) {
                this.raiseError('Non-blocking task "-par0-" has an exit sentry, this is not allowed', 
                    [this.name]);
            }

            //non blocking task cannot have output parameters
            if (this.outputs.length > 0) {
                this.raiseError('Non-blocking task "-par0-" has output parameters, this is not allowed.',
                    [this.name]);
            }

            //non blocking task cannot have a planningtable
            if (this.planningTable) {
                this.raiseError('Non-blocking task "-par0-" has a planning table, this is not allowed.',
                    [this.name]);
            }
        }

        // validate input/output parameters
        this.mappings.forEach(mapping => {
            if (!mapping['sourceRef']) {
                this.raiseWarning('The input mapping "-par1-" of element "-par0-" has empty task parameter(s)',
                    [this.name, mapping.implementationParameter?.name ?? "unnamed"]);
            }
        });
        this.mappings.forEach(mapping => {
            if (!mapping['targetRef']) {
                this.raiseWarning('The output mapping "-par1-" of element "-par0-" has empty task parameter(s)',
                    [this.name, mapping.implementationParameter?.name ?? "unnamed"]);
            }
        });

        if (this.planningTable) {
            this.planningTable.validate(validationContext);
        }

        for (let role of this.authorizedRoles) {
            if (this.caseDefinition.caseTeam.roles.filter(r => r.id === role.id).length === 0) {
                this.raiseError('An authorized role of task "-par0-" is not defined in the case team', 
                    [this.name]);
            }
        }
    }
}
