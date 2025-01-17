import ProcessModelDefinition from "../definition/process/processmodeldefinition";
import ServerFile from "./serverfile";

export default class ProcessFile extends ServerFile<ProcessModelDefinition> {
    createModelDefinition() {
        return new ProcessModelDefinition(this);
    }
}
