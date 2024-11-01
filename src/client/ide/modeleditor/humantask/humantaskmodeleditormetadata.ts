import IDE from "@ide/ide";
import { CAFIENNE_NAMESPACE, CAFIENNE_PREFIX, IMPLEMENTATION_TAG } from "@repository/definition/xmlserializable";
import HumanTaskFile from "@repository/serverfile/humantaskfile";
import ServerFile from "@repository/serverfile/serverfile";
import Icons from "@util/images/icons";
import ModelEditorMetadata from "../modeleditormetadata";
import HumantaskModelEditor from "./humantaskmodeleditor";
import ModelDefinition from "@repository/definition/modeldefinition";

export default class HumantaskModelEditorMetadata extends ModelEditorMetadata {
    static register() {
        super.registerEditorType(new HumantaskModelEditorMetadata());
    }

    /** @returns {Array<ServerFile>} */
    get modelList() {
        return this.ide?.repository.getHumanTasks() || [];
    }

    supportsFile(file: ServerFile<ModelDefinition>) {
        return file instanceof HumanTaskFile;
    }

    createEditor(ide: IDE, file: HumanTaskFile) {
        return new HumantaskModelEditor(ide, file);
    }

    get fileType() {
        return 'humantask';
    }

    get icon() {
        return Icons.HumanTask;
    }

    get description() {
        return 'Human Task Models';
    }

    /**
     * Create a new HumanTaskView model with given name and description 
     * @param {IDE} ide 
     * @param {String} name 
     * @param {String} description 
     * @returns {Promise<String>} fileName of the new model
     */
    async createNewModel(ide: IDE, name: string, description: string) {
        const newModelContent =
            `<humantask>
                <${IMPLEMENTATION_TAG} name="${name}" description="${description}" ${CAFIENNE_PREFIX}="${CAFIENNE_NAMESPACE}" class="org.cafienne.cmmn.definition.task.WorkflowTaskDefinition">
                    <task-model></task-model>
                </${IMPLEMENTATION_TAG}>
            </humantask>`;
        const fileName = name + '.humantask';
        const file = ide.repository.createHumanTaskFile(fileName, newModelContent);
        await file.save();
        await file.parse();
        return fileName;
    }
}
