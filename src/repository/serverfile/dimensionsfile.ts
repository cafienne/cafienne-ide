import Dimensions from "../definition/dimensions/dimensions";
import ServerFile from "./serverfile";

export default class DimensionsFile extends ServerFile<Dimensions> {
    createModelDefinition() {
        return new Dimensions(this);
    }
}
