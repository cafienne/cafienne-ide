import TaskDefinition from "@definition/cmmn/caseplan/task/taskdefinition";
import ShapeDefinition from "@definition/dimensions/shape";
import ServerFileDragData from "@ide/dragdrop/serverfiledragdata";
import ServerFile from "@repository/serverfile/serverfile";
import TaskMappingsEditor from "../editors/task/taskmappingseditor";
import { TaskDecoratorBox } from "./decorator/box/taskdecoratorbox";
import TaskProperties from "./properties/taskproperties";
import TaskStageView from "./taskstageview";
// import TaskHalo from "./halo/taskhalo";
// BIG TODO HERE

export default class TaskView extends TaskStageView {

    /**
     * Creates a new TaskView element.
     * @param {StageView} parent 
     * @param {TaskDefinition} definition 
     * @param {ShapeDefinition} shape 
     */
    constructor(parent, definition, shape) {
        super(parent.case, parent, definition, shape);
        this.definition = definition;

        //Define the mapping form to link task parameters with model parameters (case process humantask) 
        this.mappingsEditor = new TaskMappingsEditor(this);

        if (definition.implementationRef && !definition.implementationModel) {
            this.editor.ide.warning(`Task ${this.definition.name} refers to '${definition.implementationRef}', but that file does not exist`, 20000);
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

    /**
     * 
     * @param {ServerFileDragData} dragData 
     */
    supportsFileTypeAsImplementation(dragData) {
        return dragData.file instanceof this.definition.implementationClass;
    }

    setDropHandlers() {
        super.setDropHandlers();
        // Add drop handler with repository browser to handle changing task implementation when it is drag/dropped from there.
        this.case.editor.ide.repositoryBrowser.setDropHandler(dragData => this.changeTaskImplementation(dragData.file), dragData => this.supportsFileTypeAsImplementation(dragData));
    }

    removeDropHandlers() {
        super.removeDropHandlers();
        this.case.editor.ide.repositoryBrowser.removeDropHandler();
    }

    async generateNewTaskImplementation() {
        const potentialImplementationName = this.definition.name.split(' ').join('');
        const existingModel = this.getImplementationList().find(serverFile => serverFile.name === potentialImplementationName);
        if (existingModel) {
            this.definition.implementationRef = existingModel.fileName;
        } else {
            const fileName = await this.case.editor.ide.createNewModel(this.fileType, potentialImplementationName, this.definition.documentation.text);
            this.definition.implementationRef = fileName;
            // Open the editor for the new task implementation file
            window.location.hash = fileName;
        }
        this.case.editor.completeUserAction();
        this.refreshView();
    }

    /**
     * Changes the task implementation if the model's fileName differs from the current implementationRef.
     * If it is a newly added task, then the name maybe filled with the name of the task implementation.
     * This can be indicated by passing the "updateTaskDescription" flag to true.
     * @param {ServerFile} model 
     * @param {Boolean} updateTaskName 
     */
    async changeTaskImplementation(model, updateTaskName = false) {
        console.log("Changing task implementation to model :' ", model)
        const fileName = model.fileName;
        if (this.definition.implementationRef == fileName) {
            // no need to change. Perhaps re-generate parameters??? Better give a separate button for that ...
            return;
        }

        // Now, read the file, and update the information in the task parameters.
        const file = await this.case.editor.ide.repository.load(fileName);
        const definition = file !== undefined && file.definition;
        if (!definition) {
            this.case.editor.ide.warning('Could not read the definition ' + fileName + ' which is referenced from the task ' + this.name);
            return;
        }

        // Only update the name if we drag/drop into a new element; do not change for dropping on existing element
        if (updateTaskName) {
            console.warn(`Updating the task name to ${definition.name}`);
            const name = definition.name;
            if (name) {
                this.definition.name = name;
                this.refreshView();
            }
        }

        // Set the implementation.
        this.definition.setImplementation(fileName, definition);

        // Make sure to save changes if any.
        this.case.editor.completeUserAction();

        // Now refresh the renderers and optionally the propertiesmenu.
        this.mappingsEditor.refresh();
        this.propertiesView.show(true);
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
        if (this.definition.inputs.find(parameter => parameter.bindingRef == definitionId)) {
            return true;
        }
        if (this.definition.outputs.find(parameter => parameter.bindingRef == definitionId)) {
            return true;
        }
        return super.referencesDefinitionElement(definitionId);
    }

    get isTask() {
        return true;
    }
}
