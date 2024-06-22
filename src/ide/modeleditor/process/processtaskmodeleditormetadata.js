import ServerFile from "@repository/serverfile";
import ProcessFile from "@repository/serverfile/processfile";
import IDE from "@ide/ide";
import ModelEditorMetadata from "../modeleditormetadata";
import ProcessModelEditor from "./processmodeleditor";

export default class ProcessModelEditorMetadata extends ModelEditorMetadata {
    /** @returns {Array<ServerFile>} */
    get modelList() {
        return this.ide.repository.getProcesses();
    }

    supportsFile(file) {
        return file instanceof ProcessFile;
    }

    createEditor(ide, file) {
        return new ProcessModelEditor(ide, file);
    }

    get modelType() {
        return 'process';
    }

    /** @returns {Function} */
    get shapeType() {
        return ProcessTaskView;
    }

    get description() {
        return 'Processes';
    }

    toString() {
        // Override base implementation, because that cuts off only the s, and we need to also cut off the e.
        return 'process';
    }

    /**
     * Create a new Process model with given name and description 
     * @param {IDE} ide 
     * @param {String} name 
     * @param {String} description 
     * @param {Function} callback
     * @returns {String} fileName of the new model
     */
    createNewModel(ide, name, description, callback = (/** @type {String} */ fileName) => {}) {
        const newModelContent =
`<process name="${name}" description="${description}">
    <${EXTENSIONELEMENTS}>
        <${IMPLEMENTATION_TAG} ${CAFIENNE_PREFIX}="${CAFIENNE_NAMESPACE}" class="org.cafienne.processtask.implementation.http.HTTPCallDefinition" async="true">
        </${IMPLEMENTATION_TAG}>
    </${EXTENSIONELEMENTS}>
</process>`;
        const fileName = name + '.process';
        ide.repository.createProcessFile(fileName, newModelContent).save(andThen(() => callback(fileName)));
        return fileName;
    }
}
