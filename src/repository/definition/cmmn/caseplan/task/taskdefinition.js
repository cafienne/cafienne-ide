import Util from "@util/util";
import InputMappingDefinition from "../../contract/inputmappingdefinition";
import OutputMappingDefinition from "../../contract/outputmappingdefinition";
import ParameterDefinition from "../../contract/parameterdefinition";
import ParameterMappingDefinition from "../../contract/parametermappingdefinition";
import { TaskStageDefinition } from "../planitem";
import ModelDefinition from "@repository/definition/modeldefinition";
import TaskParameterDefinition from "./taskparameterdefinition";

export default class TaskDefinition extends TaskStageDefinition {
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
        this.isBlocking = this.parseBooleanAttribute('isBlocking', true);
        this.inputs = this.parseElements('inputs', TaskParameterDefinition);
        this.outputs = this.parseElements('outputs', TaskParameterDefinition);
        this.parseElements('parameterMapping', ParameterMappingDefinition, this.mappings);
    }

    get isTask() {
        return true;
    }

    /**
     * @returns {String}
     */
    get implementationRef() {
        throw new Error('Method must be implemented in ' + this.constructor.name);
    }

    /**
     * @param {String} ref
     */
    set implementationRef(ref) {
        throw new Error('Method must be implemented in ' + this.constructor.name);
    }

    /**
     * @returns {ModelDefinition}
     */
    get implementationModel() {
        return this._implementationModel;
    }

    set implementationModel(taskImplementation) {
        this._implementationModel = taskImplementation;
    }

    hasExternalReferences() {
        return this.implementationRef !== undefined && this.implementationRef !== '';
    }

    loadExternalReferences(callback) {
        this.resolveExternalDefinition(this.implementationRef, definition => {
            if (definition) {
                this.setImplementation(this.implementationRef, definition);
            }
            callback();
        });
    }

    /**
     * @returns {Array<ParameterMappingDefinition>}
     */
    get mappings() {
        if (!this._mappings) {
            this._mappings = [];
        }
        return this._mappings;
    }

    /**
     * @returns {String}
     */
    get validatorRef() {
        throw new Error('Method must be implemented in ' + this.constructor.name);
    }

    /**
     * @param {String} ref
     */
    set validatorRef(ref) {
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
     * @returns {String}
     */
    get type() {
        return this.constructor.name.substring(0, this.constructor.name.length - 'Definition'.length);
    }

    /**
     * Checks whether an input parameter with the given name exists, and, if not,
     * creates a new one with the specified name.
     * @param {String} name 
     */
    getInputParameterWithName(name) {
        return this.getParameterWithName(name, this.inputs);
    }

    /**
     * Checks whether an input parameter with the given name exists, and, if so,
     * creates a new one with the specified name plus a separator plus a number.
     * @param {String} name 
     */
    createInputParameterWithName(name) {
        const newParameter = this.createDefinition(TaskParameterDefinition, undefined, this.generateUniqueParameterName(name, this.inputs));
        this.inputs.push(newParameter);
        return newParameter;
    }

    /**
     * Checks whether an output parameter with the given name exists, and, if so,
     * creates a new one with the specified name plus a separator plus a number.
     * @param {String} name 
     */
    createOutputParameterWithName(name) {
        const newParameter = this.createDefinition(TaskParameterDefinition, undefined, this.generateUniqueOutputParameterName(name));
        this.outputs.push(newParameter);
        return newParameter;
    }

    /**
     * Generate a name for a task output parameter that is unique according to the pattern
     * - 'Response' ---> (there is no other parameter with the name response)
     * - 'Response.1' ---> the second one generated
     * - 'Response.2' ---> the third one
     * If in the meantime 'Response.1' is deleted or has a new name, then the fourth one will get that "free spot"
     * @param {string} name 
     * @returns {string}
     */
    generateUniqueOutputParameterName(name) {
        return this.generateUniqueParameterName(name, this.outputs);
    }

    /**
     * Generate a name for a task parameter that is unique according to the pattern
     * - 'Response' ---> (there is no other parameter with the name response)
     * - 'Response.1' ---> the second one generated
     * - 'Response.2' ---> the third one
     * If in the meantime 'Response.1' is deleted or has a new name, then the fourth one will get that "free spot"
     * @param {string} name 
     * @param {Array<TaskParameterDefinition>} siblings 
     * @returns {string}
     */
    generateUniqueParameterName(name, siblings) {
        const separator = '.';
        if (!siblings.find(p => p.name == name)) return name;
        let counter = 1;
        while (siblings.find(p => p.name == name + separator + counter) !== undefined) counter++;
        return name + separator + counter;
    }

    /**
     * 
     * @param {String} name 
     * @param {Array<TaskParameterDefinition>} collection 
     * @returns {TaskParameterDefinition}
     */
    getParameterWithName(name, collection) {
        const existingParameter = collection.find(p => p.name == name);
        if (!existingParameter) {
            const newParameter = this.createDefinition(TaskParameterDefinition, undefined, name);
            collection.push(newParameter);
            return newParameter;
        } else {
            return existingParameter;
        }
    }

    /**
     * Creates a new mapping and fills some properties if they are specified
     * 
     * @param {Function} creator 
     * @param {String} sourceRef 
     * @param {String} targetRef 
     * @param {TaskParameterDefinition} taskParameter 
     * @param {ParameterDefinition} implementationParameter 
     * @returns {ParameterMappingDefinition}
     */
    createMapping(creator, sourceRef = undefined, targetRef = undefined, taskParameter = undefined, implementationParameter = undefined) {
        const newMapping = this.createDefinition(creator);
        delete newMapping.name; // mappings have no name, so remove the one that is generated by default
        this.mappings.push(newMapping);
        newMapping.sourceRef = sourceRef;
        newMapping.targetRef = targetRef;
        newMapping.taskParameter = taskParameter;
        newMapping.implementationParameter = implementationParameter;

        return newMapping;
    }

    /**
     * 
     * @param {ParameterDefinition} implementationParameter 
     */
    createInputMapping(implementationParameter) {
        const targetRef = implementationParameter.getIdentifier();
        return this.createMapping(InputMappingDefinition, '', targetRef, undefined, implementationParameter);
    }

    /**
     * 
     * @param {ParameterDefinition} implementationParameter 
     */
    createOutputMapping(implementationParameter) {
        const sourceRef = implementationParameter.getIdentifier();
        return this.createMapping(OutputMappingDefinition, sourceRef, '', undefined, implementationParameter);
    }

    /**
     * Generates new mappings and task input/output parameters based on the
     * given xml node that represents the contract of the task implementation.
     * @param {String} implementationRef 
     * @param {ModelDefinition} implementationModel 
     */
    changeTaskImplementation(implementationRef, implementationModel) {
        console.log("Associating new implementation ref (current is " + this.implementationRef + ", new is " + implementationRef + ")");
        // First remove existing mappings and parameters.
        Util.clearArray(this.mappings);
        this.inputs = [];
        this.outputs = [];
        this.implementationRef = implementationRef;
        this.implementationModel = implementationModel;

        // Generate new task input and output parameters and mappings
        //  for each of the input and output parameters of the contract
        this.implementationModel.inputParameters.forEach(parameter => this.createInputMapping(parameter));
        this.implementationModel.outputParameters.forEach(parameter => this.createOutputMapping(parameter));
    }

    /**
     * Sets the task implementation, and optionally updates the implementationRef.
     * @param {String} implementationRef 
     * @param {ModelDefinition} implementationModel 
     */
    setImplementation(implementationRef, implementationModel) {
        this.hasImplementation = true;
        this.implementationModel = implementationModel;

        if (this.implementationRef !== implementationRef) {
            this.changeTaskImplementation(implementationRef, implementationModel);
        } else {
            this.inputMappings.forEach(mapping => {
                if (mapping.targetRef) {
                    // Note: if the input parameter cannot be found in the implementation model, the targetRef will be cleared from the mapping
                    mapping.implementationParameter = this.implementationModel.findInputParameter(mapping.targetRef);
                }
            });

            // Now iterate all implementation's input parameters and check for unused ones. For those we will generate new, default mappings.
            this.implementationModel.inputParameters.forEach(parameter => {
                const existingMapping = this.inputMappings.find(mapping => parameter.hasIdentifier(mapping.targetRef));
                if (!existingMapping) {
                    // console.log('Generating default input mapping for implementation parameter ' + parameter.name + ' in task "' + this.name + '"');
                    this.createInputMapping(parameter);
                }
            });

            this.outputMappings.forEach(mapping => {
                if (mapping.sourceRef) {
                    mapping.implementationParameter = this.implementationModel.findOutputParameter(mapping.sourceRef);
                }
            });

            // Now iterate all task output parameters and check for unused ones. For those we will generate a mapping, in order to have them directly visible in the UI.
            // It also has no sense to have unused output parameters.
            this.implementationModel.outputParameters.forEach(parameter => {
                const existingMapping = this.outputMappings.find(mapping => parameter && parameter.hasIdentifier(mapping.sourceRef));
                if (!existingMapping) {
                    // console.log('Generating default output mapping for implementation parameter ' + parameter.name + ' in task "' + this.name + '"');
                    this.createOutputMapping(parameter);
                }
            });
        }
    }

    createExportNode(parentNode, tagName, ...propertyNames) {
        super.createExportNode(parentNode, tagName, 'isBlocking', 'inputs', 'outputs', propertyNames);
    }
}
