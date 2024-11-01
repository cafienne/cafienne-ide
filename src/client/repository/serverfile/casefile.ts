import CaseDefinition from "../definition/cmmn/casedefinition";
import ServerFile from "./serverfile";

export default class CaseFile extends ServerFile<CaseDefinition> {
    createModelDefinition() {
        return new CaseDefinition(this);
    }

    validateDefinition() {
        if (this.definition && this.definition.dimensions && this.definition.dimensions.file && this.definition.dimensions.file.metadata.error) {
            this.metadata.error = 'Cannot load case because the dimensions file has error:\n' + this.definition.dimensions.file.metadata.error;
        }
    }
}
