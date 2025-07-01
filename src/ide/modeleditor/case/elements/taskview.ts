import TaskDefinition from "../../../../repository/definition/cmmn/caseplan/task/taskdefinition";
import CMMNElementDefinition from "../../../../repository/definition/cmmnelementdefinition";
import ShapeDefinition from "../../../../repository/definition/dimensions/shape";
import ServerFile from "../../../../repository/serverfile/serverfile";
import ServerFileDragData from "../../../dragdrop/serverfiledragdata";
import TaskMappingsEditor from "../editors/task/taskmappingseditor";
import { TaskDecoratorBox } from "./decorator/box/taskdecoratorbox";
import TaskHalo from "./halo/cmmn/taskhalo";
import TaskProperties from "./properties/taskproperties";
import StageView from "./stageview";
import TaskStageView from "./taskstageview";

export default abstract class TaskView<TD extends TaskDefinition = TaskDefinition> extends TaskStageView<TD> {
    mappingsEditor: TaskMappingsEditor;

    /**
     * Creates a new TaskView element.
     */
    constructor(public parent: StageView, definition: TD, shape: ShapeDefinition) {
        super(parent.case, parent, definition, shape);

        // Define the mapping form to link task parameters with model parameters (case process humantask)
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
     */
    abstract getImplementationList(): ServerFile[];

    createProperties(): TaskProperties<any> {
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

    createHalo(): TaskHalo<TaskDefinition, TaskView> {
        return new TaskHalo(this);
    }

    createDecoratorBox() {
        return new TaskDecoratorBox(this);
    }

    supportsFileTypeAsImplementation(dragData: ServerFileDragData) {
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
            this.definition.implementationReference.update(existingModel.fileName);
        } else {
            const fileName = await this.case.editor.ide.createNewModel(this.fileType, potentialImplementationName, this.definition.documentation.text);
            this.definition.implementationReference.update(fileName);
            // Open the editor for the new task implementation file
            window.location.hash = fileName;
        }
        this.case.editor.completeUserAction();
        this.refreshView();
    }

    /**
     * Changes the task implementation if the model's fileName differs from the current implementationRef.
     * If it is a newly added task, then the name maybe filled with the name of the task implementation.
     * This can be indicated by passing the "updateTaskName" flag to true.
     */
    async changeTaskImplementation(file: ServerFile, updateTaskName: boolean = false) {
        console.log("Changing task implementation to '" + file.fileName + "'");
        if (this.definition.implementationRef == file.fileName) {
            // no need to change. Perhaps re-generate parameters??? Better give a separate button for that ...
            return;
        }

        // Now, read the file, and update the information in the task parameters.
        await file.load();
        if (!file.definition) {
            this.case.editor.ide.warning('Could not read the definition ' + file.fileName + ' which is referenced from the task ' + this.name
            );
            return;
        }

        // Only update the name if we drag/drop into a new element; do not change for dropping on existing element
        if (updateTaskName) {
            console.warn(`Updating the task name to ${file.definition.name}`);
            const name = file.definition.name;
            if (name) {
                this.definition.name = name;
                this.refreshView();
            }
        }

        // Set the implementation.
        this.definition.changeTaskImplementation(file);

        // Make sure to save changes if any.
        this.case.editor.completeUserAction();

        // Now refresh the renderers and optionally the propertiesmenu.
        this.mappingsEditor.refresh();
        this.propertiesView.show(true);
    }

    abstract get fileType(): string;

    refreshReferencingFields(definitionElement: CMMNElementDefinition) {
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
                'ref-x': 0.5,
                'ref-y': 0.5,
                'y-alignment': 'middle',
                'x-alignment': 'middle'
            }
        };
    }

    // Returns true when an element of type 'elementType' can be added as a child to this element
    __canHaveAsChild(elementType: Function) {
        return super.canHaveCriterion(elementType);
    }

    __delete() {
        super.__delete();
        this.mappingsEditor.delete();
    }

    abstract get imageURL(): string;

    // Shows the element properties as icons in the element
    refreshView() {
        super.refreshView();
        this.refreshTaskImage();
    }

    refreshTaskImage() {
        // Show image of the right task type (typically blocking vs. non-blocking human task)
        this.html.find('.taskImage').attr('xlink:href', this.imageURL);
    }

    referencesDefinitionElement(definitionId: string) {
        if (this.definition.inputs.find(parameter => parameter.bindingRef.references(definitionId))) {
            return true;
        }
        if (this.definition.outputs.find(parameter => parameter.bindingRef.references(definitionId))) {
            return true;
        }
        return super.referencesDefinitionElement(definitionId);
    }

    get isTask() {
        return true;
    }
}
