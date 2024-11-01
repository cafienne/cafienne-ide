import ProcessModelDefinition from "@repository/definition/process/processmodeldefinition";
import ServerFile from "./serverfile";

export default class ProcessFile extends ServerFile<ProcessModelDefinition> {
    createModelDefinition() {
        return new ProcessModelDefinition(this);
    }
}
