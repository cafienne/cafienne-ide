import RepositoryBrowser from "@ide/repositorybrowser";
import ServerFile from "@repository/serverfile/serverfile";
import IDE from "../ide";
import ModelEditor from "./modeleditor";
import ModelDefinition from "@repository/definition/modeldefinition";

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

    get modelType(): string {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    toString() {
        return this.description.substring(0, this.description.length - 1).toLowerCase();
    }

    /**
     * Create a new model with the specified model name.
     * @param {IDE} ide 
     * @param {String} newModelName 
     * @param {String} newModelDescription 
     * @returns {Promise<String>} fileName of the new model
     */
    async createNewModel(ide: IDE, newModelName: string, newModelDescription: string): Promise<string> {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }
}
