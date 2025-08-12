import ServerFile from "../serverfile/serverfile";
import Dimensions from "./dimensions/dimensions";
import ModelDefinition from "./modeldefinition";
import ExternalReference from "./references/externalreference";

export default abstract class GraphicalModelDefinition extends ModelDefinition {
    _dimensions: ExternalReference<Dimensions>;

    constructor(public file: ServerFile<any>, public dimensionsFileName: string) {
        super(file);
        this._dimensions = new ExternalReference<Dimensions>(this, dimensionsFileName);
    }

    get dimensions(): Dimensions | undefined {
        return this._dimensions.getDefinition();
    }
}
