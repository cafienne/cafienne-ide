class ParameterMappingDefinition extends UnnamedCMMNElementDefinition {
    /**
     * 
     * @param {Element} importNode 
     * @param {CaseDefinition} caseDefinition 
     * @param {TaskDefinition} parent 
     */
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
        this.parent = parent;
        this.sourceRef = this.parseAttribute('sourceRef');
        this.targetRef = this.parseAttribute('targetRef');
        this.transformation = this.parseElement('transformation', ExpressionDefinition);
    }

    get taskParameterName() {
        return '';
    }

    /**
     * Creates a new input or output parameter (depending on the type of mapping)
     * @param {String} name 
     * @returns {ParameterDefinition}
     */
    createTaskParameter(name) {
        const task = this.parent;
        this.taskParameter = this.isInputMapping ? task.getInputParameterWithName(name) : task.getOutputParameterWithName(name);
        return this.taskParameter;
    }

    get taskParameter() {
        if (this.isInputMapping) {
            return this.source;
        } else {
            return this.target;
        }
    }

    /**
     * @param {ParameterDefinition} parameter
     */
    set taskParameter(parameter) {
        if (this.isInputMapping) {
            this.source = parameter;
        } else {
            this.target = parameter;
        }
    }

    get implementationParameter() {
        return this._implementationParameter;
    }

    /**
     * @param {ImplementationParameterDefinition} parameter
     */
    set implementationParameter(parameter) {
        this._implementationParameter = parameter;
        if (this.isInputMapping) {
            this.target = parameter;
        } else {
            this.source = parameter;
        }
    }

    /**
     * Returns the name of the implementation parameter if there is an implementation parameter; else an empty string.
     */
    get implementationParameterName() {
        return this.implementationParameter ? this.implementationParameter.name : '';
    }

    /**
     * Returns the id of the implementation parameter if there is an implementation parameter; else an empty string.
     */
    get implementationParameterId() {
        const id = this.isInputMapping ? this.targetRef : this.sourceRef;
        return id;
    }

    /**
     * Either source or target will be undefined, because one refers to the task-implementation's input/output parameter
     * @returns {ParameterDefinition | ImplementationParameterDefinition}
     */
    get source() {
        return this.caseDefinition.getElement(this.sourceRef, ParameterDefinition);
    }

    set source(parameter) {
        this.sourceRef = parameter ? parameter.id : undefined;
    }

    /**
     * Either source or target will be undefined, because one refers to the task-implementation's input/output parameter
     * @returns {ParameterDefinition | ImplementationParameterDefinition}
     */
    get target() {
        return this.caseDefinition.getElement(this.targetRef, ParameterDefinition);
    }

    set target(parameter) {
        this.targetRef = parameter ? parameter.id : undefined;
    }

    /**
     * Returns true if there are no fields set in the mapping (i.e., it was a generated one)
     */
    isEmpty() {
        if (this.targetRef) { // Perhaps an empty input mapping
            // Check whether it is a generated mapping, by determining whether a binding is set
            if (this.sourceRef && this.source && this.source == this.taskParameter && !this.taskParameter.bindingRef) {
                if (! this.body) {
                    return true;
                }
            }
            return ! this.sourceRef && ! this.body;
        } else if (this.sourceRef) { // Perhaps and empty output mapping 
            return ! this.targetRef && ! this.body;
        } else if (this.body) { // Probably empty generated output mapping
            return false;
        } else {
            // That is really weird, how could we end up here
            return true;
        }
    }

    get isInputMapping() {
        const sourceRef = this.sourceRef;
        const targetRef = this.targetRef;
        const sourceElement = this.caseDefinition.getElement(this.sourceRef);
        const targetElement = this.caseDefinition.getElement(this.targetRef);

        // First simple cases: if either attribute is filled, and the corresponding element is found in the case,
        //  it is immediately clear.
        if (sourceRef && sourceElement) {
            return true;
        }
        if (targetRef && targetElement) {
            return false;
        }

        if (!sourceRef && !targetRef) {
            // If neither attribute is set, then this is an entirely new mapping; but that is mostly only possible for output mappings,
            //  because there is a fixed set of input mappings.
            return false;
        }

        /** @type {TaskDefinition} */
        const taskDefinition = this.parent;
        if (taskDefinition.implementationModel) {
            // If we have an implementation contract available, we can look up the source and/or target ref in the contract.
            if (sourceRef && taskDefinition.implementationModel.findOutputParameter(sourceRef)) {
                return false;
            } else if (targetRef && taskDefinition.implementationModel.findInputParameter(targetRef)) {
                return true;
            } else {
                // this is really an error; source and/or target are filled, but without proper refererences
                console.error(`The mapping '${this.id}' in task '${taskDefinition.name}' has invalid source and target references (sourceRef = "${this.sourceRef}", targetRef = "${this.targetRef}")`, this)
                return false;
            }
        } else {
            // No implementation available yet. Let's assume that a bit here.
            if (sourceRef && targetRef) {
                // Both are set?! Must be some error here, since either should have been found in the task definition itself.
                console.error(`The mapping '${this.id}' in task '${taskDefinition.name}' has invalid source and target references (sourceRef = "${this.sourceRef}", targetRef = "${this.targetRef}")`, this)
                return false;
            } else if (sourceRef) {
                return false;
            } else {
                return true;
            }
        }
    }

    get body() {
        return this.transformation ? this.transformation.body : '';
    }

    set body(expression) {
        if (expression) {
            if (!this.transformation) {
                this.transformation = this.createDefinition(ExpressionDefinition);
            }
            this.transformation.body = expression;
        } else {
            if (this.transformation) {
                this.transformation.removeDefinition();
            }
        }
    }

    createExportNode(parentNode) {
        if (this.isEmpty()) {
            // console.log("Not persisting empty mapping in task "+this.parent.name);
            return;
        }
        super.createExportNode(parentNode, 'parameterMapping', 'sourceRef', 'targetRef', 'transformation');
    }
}
