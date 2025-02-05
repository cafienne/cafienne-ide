import CreateNewModelDialog from "../createnewmodeldialog";
import RepositoryBrowser from "../repositorybrowser";
import ModelDefinition from "../../repository/definition/modeldefinition";
import ServerFile from "../../repository/serverfile/serverfile";
import IDE from "../ide";
import ModelEditor from "./modeleditor";

export default class ModelEditorMetadata {
    public static types: Array<ModelEditorMetadata> = [];

    /**
     * Registers a type of editor, e.g. HumanTaskEditor, CaseModelEditor, ProcessModelEditor
     */
    public static registerEditorType(editorMetadata: ModelEditorMetadata) {
        this.types.push(editorMetadata);
    }


    public ide?: IDE;

    /**
     * Initializes metadata for a type of ModelEditor within the IDE
     */
    init(repositoryBrowser: RepositoryBrowser) {
        const ide = repositoryBrowser.ide;
        this.ide = ide;
        repositoryBrowser.createModelListPanel(this);
    }

    /**
     * Whether the metadata is associated with this kind of file
     */
    supportsFile(file: ServerFile<ModelDefinition>) {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    /**
     * Create an editor for this file
     */
    createEditor(ide: IDE, file: ServerFile<ModelDefinition>): ModelEditor {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    get supportsDeploy() {
        return false;
    }

    get modelList(): Array<ServerFile<ModelDefinition>> {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    /**
     * Returns the image that can be used when rendering a server file that this editor can load
     */
    get icon(): string {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    get description(): string {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    get fileType(): string {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    toString() {
        return this.description.substring(0, this.description.length - 1).toLowerCase();
    }

    /**
     * Create a new model with the specified model name.
     */
    async createNewModel(ide: IDE, newModelName: string, newModelDescription: string): Promise<string> {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    async openCreateModelDialog() {
        const filetype = this.fileType;
        const text = `Create a new ${this.toString()}`;
        if (!this.ide) return;
        const dialog = new CreateNewModelDialog(this.ide, text);
        dialog.showModalDialog(async (newModelInfo: any) => {
            if (!this.ide) return;
            if (newModelInfo) {
                const newModelName = newModelInfo.name;
                const newModelDescription = newModelInfo.description;

                // Check if a valid name is used
                if (this.ide && !this.ide.repositoryBrowser.isValidEntryName(newModelName)) {
                    return;
                }

                const fileName = newModelName + '.' + filetype;
                if (this.ide.repository.hasFile(fileName)) {
                    this.ide.danger('A ' + filetype + ' with this name already exists and cannot be overwritten', 5000);
                    return;
                }

                await this.ide.createNewModel(filetype, newModelName, newModelDescription);
                window.location.hash = fileName;
            };
        });
    }
}
