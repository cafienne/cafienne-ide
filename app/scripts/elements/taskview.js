class TaskView extends TaskStageView {

    /**
     * Creates a new TaskView element.
     * @param {CMMNElementView} parent 
     * @param {PlanItem} definition
     * @param {TaskDefinition} planItemDefinition 
     * @param {ShapeDefinition} shape 
     */
    constructor(parent, definition, planItemDefinition, shape) {
        super(parent, definition, planItemDefinition, shape);
        this.planItemDefinition = planItemDefinition;

        //Define the mapping form to link task parameters with model parameters (case process humantask) 
        this.mappingsEditor = new TaskMappingsEditor(this);

        if (planItemDefinition.implementationRef && !planItemDefinition.implementationModel) {
            this.editor.ide.warning(`Task ${this.definition.name} refers to '${planItemDefinition.implementationRef}', but that file does not exist`, 20000);
        }
    }

    showMappingsEditor() {
        this.mappingsEditor.show();
    }

    /**
     * Returns the list of models that can serve as an implementation for this task.
     * @returns {Array<ServerFile>}
     */
    getImplementationList() {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    createProperties() {
        return new TaskProperties(this);
    }

    deleteSubViews() {
        super.deleteSubViews();
        this.mappingsEditor.delete();
    }

    refreshSubViews() {
        super.refreshSubViews();
        if (this.mappingsEditor.visible) {
            this.mappingsEditor.refresh();
        }
    }

    createHalo() {
        return new TaskHalo(this);
    }

    createDecoratorBox() {
        return new TaskDecoratorBox(this);
    }

    setDropHandlers() {
        super.setDropHandlers();
        // Add drop handler with repository browser to handle changing task implementation when it is drag/dropped from there.
        this.case.editor.ide.repositoryBrowser.setDropHandler(dragData => this.changeTaskImplementation(dragData), dragData => this.constructor.name == dragData.shapeType);
    }

    removeDropHandlers() {
        super.removeDropHandlers();
        this.case.editor.ide.repositoryBrowser.removeDropHandler();
    }

    generateNewTaskImplementation() {
        const potentialImplementationName = this.definition.name.split(' ').join('');
        const existingModel = this.getImplementationList().find(serverFile => serverFile.name === potentialImplementationName);
        if (existingModel) {
            this.planItemDefinition.implementationRef = existingModel.fileName;
        } else {
            const fileName = this.case.editor.ide.createNewModel(this.fileType, potentialImplementationName, this.definition.documentation.text, fileName => {
                window.location.hash = fileName;
            });
            this.planItemDefinition.implementationRef = fileName;
        }
        this.case.editor.completeUserAction();
        this.refreshView();
    }

    /**
     * Changes the task implementation if the model's fileName differs from the current implementationRef.
     * If it is a newly added task, then the name maybe filled with the name of the task implementation.
     * This can be indicated by passing the "updateTaskDescription" flag to true.
     * @param {DragData | ServerFile} model 
     * @param {Boolean} updateTaskName 
     */
    changeTaskImplementation(model, updateTaskName = false) {
        const fileName = model.fileName;
        if (this.planItemDefinition.implementationRef == fileName) {
            // no need to change. Perhaps re-generate parameters??? Better give a separate button for that ...
            return;
        }

        // Now, read the file, and update the information in the task parameters.
        this.case.editor.ide.repository.load(fileName, file => {
            const model = file.definition;
            if (!model) {
                this.case.editor.ide.warning('Could not read the model ' + fileName + ' which is referenced from the task ' + this.name);
                return;
            }

            // Only update the name if we drag/drop into a new element; do not change for dropping on existing element
            if (updateTaskName) {
                console.warn(`Updating the task name to ${model.name}`);
                const name = model.name;
                if (name) {
                    this.definition.name = name;
                    this.refreshView();
                }
            }

            // Set the implementation. If it leads to new mappings, this method will return "true, and we wil"
            this.planItemDefinition.setImplementation(fileName, model);

            // Make sure to save changes if any.
            this.case.editor.completeUserAction();

            // Now refresh the renderers and optionally the propertiesmenu.
            this.mappingsEditor.refresh();
            this.propertiesView.show(true);
        });
    }

    /** @returns {String} */
    get fileType() {
        throw new Error('TaskView of type ' + this.constructor.name + ' must implement file type');
    }

    refreshReferencingFields(definitionElement) {
        super.refreshReferencingFields(definitionElement);
        this.mappingsEditor.refresh();
    }

    get __planningTablePosition() {
        return { x: 22, y: -9 };
    }

    get markup() {
        return `<g class="scalable">
                    <rect class="cmmn-shape cmmn-border cmmn-${this.constructor.name.toLowerCase()}-shape" rx="5" ry="5" width="100" height="60" />
                </g>
                <text class="cmmn-text" />
                <image class="taskImage" x="0" y="-4" width="24" height="24" xlink:href="${this.imageURL}" />
                ${this.decoratorBox.markup}`;
    }

    get textAttributes() {
        return {
            'text': {
                ref: '.cmmn-shape',
                'ref-x': .5,
                'ref-y': .5,
                'y-alignment': 'middle',
                'x-alignment': 'middle'
            }
        };
    }

    //returns true when an element of type 'elementType' can be added as a child to this element
    __canHaveAsChild(elementType) {
        return super.canHaveCriterion(elementType);
    }

    __delete() {
        super.__delete();
        this.mappingsEditor.delete();
    }

    //validate: all steps to check this element
    __validate() {
        super.__validate();

        if (!this.planItemDefinition.implementationRef) {
            this.raiseValidationIssue(3);
        }

        if (this.planItemDefinition.isBlocking == false) {
            //non blocking task cannot have exit sentries
            if (this.definition.exitCriteria.length > 0) {
                this.raiseValidationIssue(5);
            }

            //non blocking task cannot have output parameters
            if (this.planItemDefinition.outputs.length > 0) {
                this.raiseValidationIssue(6);
            }

            //non blocking human task cannot have a planningtable
            if (this.planItemDefinition.planningTable) {
                this.raiseValidationIssue(8);
            }
        }

        this.validateParameterMappings(this.planItemDefinition.inputMappings, 'sourceRef', 'input');
        this.validateParameterMappings(this.planItemDefinition.inputMappings, 'targetRef', 'input');
    }

    validateParameterMappings(mappings, referenceProperty, mappingType) {
        mappings.forEach(mapping => {
            if (!mapping[referenceProperty]) {
                this.raiseValidationIssue(37, [this.name, this.case.name, mappingType]);
            }
        });
    }

    /**
     * @returns {String}
     */
    get imageURL() {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    //shows the element properties as icons in the element
    refreshView() {
        super.refreshView();
        this.refreshTaskImage();
    }

    refreshTaskImage() {
        //show image of the right task type (typically blocking vs. non-blocking human task)
        this.html.find('.taskImage').attr('xlink:href', this.imageURL);
    }

    referencesDefinitionElement(definitionId) {
        if (this.planItemDefinition.inputs.find(parameter => parameter.bindingRef == definitionId)) {
            return true;
        }
        if (this.planItemDefinition.outputs.find(parameter => parameter.bindingRef == definitionId)) {
            return true;
        }
        return super.referencesDefinitionElement(definitionId);
    }
}
