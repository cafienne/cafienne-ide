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

    toString() {
        // Override base implementation, because that cuts off only the s, and we need to also cut off the e.
        return 'testcase';
    }

    /**
     * Create a new Process model with given name and description 
     * @returns fileName of the new model
     */
    async createNewModel(ide: IDE, name: string, description: string) {
        const newModelContent =
`<process name="${name}" description="${description}">
    <${EXTENSIONELEMENTS}>
        <${IMPLEMENTATION_TAG} ${CAFIENNE_PREFIX}="${CAFIENNE_NAMESPACE}" class="org.cafienne.processtask.implementation.http.HTTPCallDefinition" async="true">
        </${IMPLEMENTATION_TAG}>
    </${EXTENSIONELEMENTS}>
</process>`;
        const fileName = name + '.' + this.fileType;
        const file = ide.repository.createTestcaseFile(fileName, newModelContent);
        await file.save();
        return fileName;
    }
}
