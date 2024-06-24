import ProcessModelDefinition from "@repository/definition/process/processmodeldefinition";
import ServerFile from "../serverfile";

export default class ProcessFile extends ServerFile {
    createModelDefinition() {
        return new ProcessModelDefinition(this);
    }

    /** @returns {ProcessModelDefinition} */
    get definition() {
        return /** @type {ProcessModelDefinition} */ (this.content.definition);
    }
}
