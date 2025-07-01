import ParameterDefinition from "./contract/parameterdefinition";
import ModelDefinition from "./modeldefinition";

export default interface ParameterizedModelDefinition<M extends ModelDefinition> {

    /**
     * A ModelDefinition must have input parameters.
     */
    get inputParameters(): ParameterDefinition<M>[];

    /**
     * A ModelDefinition must have output parameters.
     */
    get outputParameters(): ParameterDefinition<M>[];

    findInputParameter(identifier: string): ParameterDefinition<M> | undefined;

    findOutputParameter(identifier: string): ParameterDefinition<M> | undefined;
}
