import IDE from "@ide/ide";
import TypeDefinition from "@repository/definition/type/typedefinition";
import TypeFile from "@repository/serverfile/typefile";
import Shapes from "@util/images/shapes";
import ModelEditorMetadata from "../modeleditormetadata";
import TypeModelEditor from "./typemodeleditor";

export default class TypeModelEditorMetadata extends ModelEditorMetadata {
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

    get icon() {
        return Shapes.CaseFileItem;
    }

    get description() {
        return 'Types';
    }

    /**
     * Create a new CaseFileItemView model with given name and description 
     * @param {IDE} ide 
     * @param {String} name 
     * @param {String} description 
     * @returns {Promise<String>} fileName of the new model
     */
    async createNewModel(ide, name, description) {
        const fileName = name + '.type';
        const file = ide.repository.createTypeFile(fileName, TypeDefinition.createDefinitionSource(name));
        return file.save().then(() => file.parse()).then(() => fileName);
    }
}
