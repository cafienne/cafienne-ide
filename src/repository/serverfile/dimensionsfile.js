import ServerFile from "../serverfile";

export default class DimensionsFile extends ServerFile {
    createDefinition() {
        return new Dimensions(this);
    }

    /** @returns {Dimensions} */
    get definition() {
        return /** @type {Dimensions} */ (this.content.definition);
    }
}
