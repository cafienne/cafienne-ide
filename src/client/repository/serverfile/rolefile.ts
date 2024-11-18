import ServerFile from "./serverfile";
import ModelDefinition from "@repository/definition/modeldefinition";

export default class RoleFile extends ServerFile<ModelDefinition> {
    createModelDefinition() {
        return new ModelDefinition(this);
    }
}
