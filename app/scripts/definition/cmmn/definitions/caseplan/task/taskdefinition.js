class TaskDefinition extends TaskStageDefinition {
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
        this.isBlocking = this.parseBooleanAttribute('isBlocking', true);
        this.inputs = this.parseElements('inputs', ParameterDefinition);
        this.outputs = this.parseElements('outputs', ParameterDefinition);
        this.mappings = this.parseElements('parameterMapping', ParameterMappingDefinition);
    }

    defaultShapeSize() {
        return { w: 140, h: 80 };
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
     * Checks whether an input parameter with the given name exists, and, if not,
     * creates a new one with the specified name.
     * @param {String} name 
     */
    getInputParameterWithName(name) {
        return this.getParameterWithName(name, this.inputs);
    }

    /**
     * Checks whether an output parameter with the given name exists, and, if not,
     * creates a new one with the specified name.
     * @param {String} name 
     */
    getOutputParameterWithName(name) {
        return this.getParameterWithName(name, this.outputs);
    }

    /**
     * 
     * @param {String} name 
     * @param {Array<ParameterDefinition>} collection 
     * @returns {ParameterDefinition}
     */
    getParameterWithName(name, collection) {
        const existingParameter = collection.find(p => p.name == name);
        if (!existingParameter) {
            const newParameter = this.createDefinition(ParameterDefinition, undefined, name);
            collection.push(newParameter);
            return newParameter;
        } else {
            return existingParameter;
        }
    }

    /**
     * Creates a new mapping and fills some properties if they are specified
     * 
     * @param {String} sourceRef 
     * @param {String} targetRef 
     * @param {ParameterDefinition} taskParameter 
     * @param {ImplementationParameterDefinition} implementationParameter 
     * @returns {ParameterMappingDefinition}
     */
    createMapping(sourceRef = undefined, targetRef = undefined, taskParameter = undefined, implementationParameter = undefined) {
        const newMapping = this.createDefinition(ParameterMappingDefinition);
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
     * @param {ParameterDefinition} taskParameter 
     * @param {ImplementationParameterDefinition} implementationParameter 
     */
    createInputMapping(taskParameter, implementationParameter) {
        const sourceRef = taskParameter ? taskParameter.id : '';
        const targetRef = implementationParameter ? implementationParameter.id : '';
        return this.createMapping(sourceRef, targetRef, taskParameter, implementationParameter);
    }

    /**
     * 
     * @param {ParameterDefinition} taskParameter 
     * @param {ImplementationParameterDefinition} implementationParameter 
     */
    createOutputMapping(taskParameter, implementationParameter) {
        const sourceRef = implementationParameter ? implementationParameter.id : '';
        const targetRef = taskParameter ? taskParameter.id : '';
        return this.createMapping(sourceRef, targetRef, taskParameter, implementationParameter);
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
        /** @type {Array<ParameterMappingDefinition>} */
        this.mappings = [];
        this.inputs = [];
        this.outputs = [];
        this.implementationRef = implementationRef;
        this.implementationModel = implementationModel;

        // Generate new task input and output parameters and mappings
        //  for each of the input and output parameters of the contract
        this.implementationModel.inputParameters.forEach(parameter => {
            console.log('Generating default input mapping for implementation parameter ' + parameter.name + ' in task "' + this.name + '"');
            const newTaskInputParameter = this.getInputParameterWithName(parameter.name);
            const newMapping = this.createInputMapping(newTaskInputParameter, parameter);
            // newMapping.sourceRef = newTaskInputParameter.id;
            // newMapping.taskParameter = newTaskInputParameter;
            // newMapping.targetRef = parameter.id ? parameter.id : parameter.name;
            // newMapping.implementationParameter = parameter;
            // newMapping.xyz = "ABC" + parameter.name;
            // console.log("This.mappings: ", this.mappings)
        });
        this.implementationModel.outputParameters.forEach(parameter => {
            const newTaskOutputParameter = this.getOutputParameterWithName(parameter.name);
            this.createOutputMapping(newTaskOutputParameter, parameter);
        });
        // Show a message if we've generated new parameters
        if (this.mappings.length > 0) {
            ide.info('Generated task parameters for ' + this.name, 2000);

        }
    }

    /**
     * Sets the task implementation, and optionally updates the implementationRef.
     * @param {String} implementationRef 
     * @param {ModelDefinition} implementationModel 
     */
    setImplementation(implementationRef, implementationModel) {
        this.hasImplementation = true;
        this.implementationModel = implementationModel;

        if (this.implementationRef != implementationRef) {
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
                if (! existingMapping) {
                    console.log('Generating default input mapping for implementation parameter ' + parameter.name + ' in task "' + this.name + '"');
                    const inputParameter = this.getInputParameterWithName(parameter.name);
                    this.createInputMapping(inputParameter, parameter);
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
                if (! existingMapping) {
                    console.log('Generating default output mapping for implementation parameter ' + parameter.name + ' in task "' + this.name + '"');
                    const newMapping = this.createOutputMapping(undefined, parameter);
                    newMapping.sourceRef = parameter.id ? parameter.id : parameter.name;
                }
            });
        }
    }

    createExportNode(parentNode, tagName, ...propertyNames) {
        super.createExportNode(parentNode, tagName, 'isBlocking', 'inputs', 'outputs', propertyNames);
    }
}
