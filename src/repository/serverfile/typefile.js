import TypeDefinition from "@repository/definition/type/typedefinition";
import ServerFile from "@repository/serverfile";

export default class TypeFile extends ServerFile {
    createModelDefinition() {
        return new TypeDefinition(this);
    }

    /** @returns {TypeDefinition} */
    get definition() {
        return /** @type {TypeDefinition} */ (this.content.definition);
    }
}
