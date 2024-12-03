import IDE from "@ide/ide";
import ModelDefinition from "@repository/definition/modeldefinition";
import { CAFIENNE_NAMESPACE, CAFIENNE_PREFIX, EXTENSIONELEMENTS, IMPLEMENTATION_TAG } from "@repository/definition/xmlserializable";
import TestcaseFile from "@repository/serverfile/testcasefile";
import ServerFile from "@repository/serverfile/serverfile";
import Icons from "@util/images/icons";
import ModelEditorMetadata from "../modeleditormetadata";
import TestcaseModelEditor from "./testcasemodeleditor";

export default class TestcaseModelEditorMetadata extends ModelEditorMetadata {
    /** @returns {Array<ServerFile>} */
    get modelList() {
        return this.ide?.repository.getTestcases() || [];
    }

    supportsFile(file: ServerFile<ModelDefinition>) {
        return file instanceof TestcaseFile;
    }

    createEditor(ide: IDE, file: TestcaseFile) {
        return new TestcaseModelEditor(ide, file);
    }

    get fileType() {
        return 'testcase';
    }

    get icon() {
        return Icons.ProcessTask;
    }

    get description() {
        return 'Testcases';
    }

    /**
     * Create a new Process model with given name and description 
     * @returns fileName of the new model
     */
    async createNewModel(ide: IDE, name: string, description: string) {
        const newModelContent =
            `<testcase name="${name}">
                    <documentation>
                        <text>${description}</text>
                    </documentation>
                    <fixture/>
            </testcase>`;
        const file = ide.repository.createTestcaseFile(`${name}.${this.fileType}`, newModelContent);
        await file.save();

        return file.fileName;
    }
}
