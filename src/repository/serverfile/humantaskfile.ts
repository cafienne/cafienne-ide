import HumanTaskModelDefinition from "../definition/humantask/humantaskmodeldefinition";
import ServerFile from "./serverfile";

export default class HumanTaskFile extends ServerFile<HumanTaskModelDefinition> {
    createModelDefinition() {
        return new HumanTaskModelDefinition(this);
    }
}
