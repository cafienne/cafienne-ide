import ServerFile from "@repository/serverfile";
import IDE from "../ide";
import ModelEditor from "./modeleditor";

export default class ModelEditorMetadata {
    /**
     * Initializes metadata for a type of ModelEditor within the IDE
     * @param {IDE} ide 
     */
    init(ide) {
        this.ide = ide;
        this.ide.repository.onListRefresh(() => {
            if (! this.modelListPanel) {
                this.modelListPanel = this.ide.repositoryBrowser.createModelListPanel(this);
            }
            this.modelListPanel.setModelList(this.modelList, this.shapeType);
        });
    }

    /**
     * Whether the metadata is associated with this kind of file
     * @param {ServerFile} file 
     */
    supportsFile(file) {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    /**
     * Create an editor for this file
     * @param {IDE} ide 
     * @param {ServerFile} file 
     * @returns {ModelEditor}
     */
    createEditor(ide, file) {
        throw new Error('This method must be implemented in ' + this.constructor.name);        
    }

    get supportsDeploy() {
        return false;
    }

    /** @returns {Array<ServerFile>} */
    get modelList() {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    /** @returns {Function} */
    get shapeType() {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    /** @returns {String} */
    get description() {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    /** @returns {String} */
    get modelType() {
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
     * @param {Function} callback 
     * @returns {String} fileName of the new model
     */
    createNewModel(ide, newModelName, newModelDescription, callback) {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }
}