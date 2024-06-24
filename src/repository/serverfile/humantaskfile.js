import HumanTaskModelDefinition from "@repository/definition/humantask/humantaskmodeldefinition";
import ServerFile from "../serverfile";

export default class HumanTaskFile extends ServerFile {
    createModelDefinition() {
        return new HumanTaskModelDefinition(this);
    }

    /** @returns {HumanTaskModelDefinition} */
    get definition() {
        return /** @type {HumanTaskModelDefinition} */ (this.content.definition);
    }
}
