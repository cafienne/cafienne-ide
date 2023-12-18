import IDE from "@ide/ide";
import ModelEditorMetadata from "../modeleditormetadata";
import ServerFile from "@repository/serverfile";
import TypeModelEditor from "./typemodeleditor";
import CaseFileItemView from "../case/elements/casefileitemview";
import { andThen } from "@util/promise/followup";
import TypeFile from "@repository/serverfile/typefile";

export default class TypeModelEditorMetadata extends ModelEditorMetadata {
    /** @returns {Array<ServerFile>} */
    get modelList() {
        return this.ide.repository.getTypes();
    }

    supportsFile(file) {
        return file instanceof TypeFile;
    }

    createEditor(ide, file) {
        return new TypeModelEditor(ide, file);
    }

    get modelType() {
        return 'type';
    }

    /** @returns {Function} */
    get shapeType() {
        return CaseFileItemView;
    }

    get description() {
        return 'Types';
    }

    /**
     * Create a new CaseFileItemView model with given name and description 
     * @param {IDE} ide 
     * @param {String} name 
     * @param {String} description 
     * @param {Function} callback
     * @returns {String} fileName of the new model
     */
    createNewModel(ide, name, description, callback = (/** @type {String} */ fileName) => { }) {
        const fileName = name + '.type';
        const newModelContent = `<type id="${fileName}" name="${name}"><schema/></type>`;
        ide.repository.createTypeFile(fileName, newModelContent).save(andThen(() => callback(fileName)));
        return fileName;
    }
}
