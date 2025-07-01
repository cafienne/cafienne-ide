import Dimensions from "./dimensions/dimensions";
import ModelDefinition from "./modeldefinition";

export default abstract class GraphicalModel extends ModelDefinition {
    abstract get dimensions(): Dimensions | undefined;
}
