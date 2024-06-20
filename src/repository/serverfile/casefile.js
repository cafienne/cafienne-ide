import ServerFile from "../serverfile";

export default class CaseFile extends ServerFile {
    createModelDefinition() {
        return new CaseDefinition(this);
    }

    /** @returns {CaseDefinition} */
    get definition() {
        return /** @type {CaseDefinition} */ (this.content.definition);
    }

    validateDefinition() {
        if (this.definition && this.definition.dimensions && this.definition.dimensions.file && this.definition.dimensions.file.metadata.error) {
            this.metadata.error = 'Cannot load case because the dimensions file has error:\n' + this.definition.dimensions.file.metadata.error;
        }
    }
}
