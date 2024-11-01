import IDE from "@ide/ide";
import { CAFIENNE_NAMESPACE, CAFIENNE_PREFIX, EXTENSIONELEMENTS, IMPLEMENTATION_TAG } from "@repository/definition/xmlserializable";
import ProcessFile from "@repository/serverfile/processfile";
import ServerFile from "@repository/serverfile/serverfile";
import Icons from "@util/images/icons";
import ModelEditorMetadata from "../modeleditormetadata";
import ProcessModelEditor from "./processmodeleditor";
import ModelDefinition from "@repository/definition/modeldefinition";
import ModelEditor from "../modeleditor";

export default class ProcessModelEditorMetadata extends ModelEditorMetadata {
    /** @returns {Array<ServerFile>} */
    get modelList() {
        return this.ide?.repository.getProcesses() || [];
    }

    supportsFile(file: ServerFile<ModelDefinition>) {
        return file instanceof ProcessFile;
    }

    createEditor(ide: IDE, file: ProcessFile) {
        return new ProcessModelEditor(ide, file);
    }

    get fileType() {
        return 'process';
    }

    get icon() {
        return Icons.ProcessTask;
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
     * @returns {Promise<String>} fileName of the new model
     */
    async createNewModel(ide: IDE, name: string, description: string) {
        const newModelContent =
`<process name="${name}" description="${description}">
    <${EXTENSIONELEMENTS}>
        <${IMPLEMENTATION_TAG} ${CAFIENNE_PREFIX}="${CAFIENNE_NAMESPACE}" class="org.cafienne.processtask.implementation.http.HTTPCallDefinition" async="true">
        </${IMPLEMENTATION_TAG}>
    </${EXTENSIONELEMENTS}>
</process>`;
        const fileName = name + '.process';
        const file = ide.repository.createProcessFile(fileName, newModelContent);
        await file.save();
        await file.parse();
        return fileName;
    }
}
