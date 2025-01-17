import TypeDefinition from "../definition/type/typedefinition";
import ServerFile from "./serverfile";

export default class TypeFile extends ServerFile<TypeDefinition> {
    createModelDefinition() {
        return new TypeDefinition(this);
    }
}
