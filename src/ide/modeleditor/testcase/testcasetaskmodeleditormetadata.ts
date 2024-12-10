import ModelDefinition from "../../../repository/definition/modeldefinition";
import ServerFile from "../../../repository/serverfile/serverfile";
import TestcaseFile from "../../../repository/serverfile/testcasefile";
import IDE from "../../ide";
import Images from "../../util/images/images";
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
        return Images.Test;
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
            </testcase>`;
        const file = ide.repository.createTestcaseFile(`${name}.${this.fileType}`, newModelContent);
        await file.save();

        return file.fileName;
    }
}
