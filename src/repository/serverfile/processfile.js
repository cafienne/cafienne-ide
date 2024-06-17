import ServerFile from "../serverfile";

export default class ProcessFile extends ServerFile {
    createDefinition() {
        return new ProcessModelDefinition(this);
    }

    /** @returns {ProcessModelDefinition} */
    get definition() {
        return /** @type {ProcessModelDefinition} */ (this.content.definition);
    }
}
