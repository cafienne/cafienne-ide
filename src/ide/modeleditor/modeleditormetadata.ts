import ModelDefinition from "../../repository/definition/modeldefinition";
import ServerFile from "../../repository/serverfile/serverfile";
import CreateNewModelDialog from "../createnewmodeldialog";
import IDE from "../ide";
import RepositoryBrowser from "../repositorybrowser";
import ModelEditor from "./modeleditor";

export default abstract class ModelEditorMetadata {
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
    abstract supportsFile(file: ServerFile<ModelDefinition>): boolean;

    /**
     * Create an editor for this file
     */
    abstract createEditor(ide: IDE, file: ServerFile<ModelDefinition>): ModelEditor;

    get supportsDeploy() {
        return false;
    }

    abstract get modelList(): Array<ServerFile<ModelDefinition>>;

    /**
     * Returns the image that can be used when rendering a server file that this editor can load
     */
    abstract get icon(): string;

    abstract get description(): string;

    abstract get fileType(): string;

    toString() {
        return this.description.substring(0, this.description.length - 1).toLowerCase();
    }

    /**
     * Create a new model with the specified model name.
     */
    abstract createNewModel(ide: IDE, newModelName: string, newModelDescription: string): Promise<string>;

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
