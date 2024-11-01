import ParameterMappingDefinition from "./parametermappingdefinition";

export default class InputMappingDefinition extends ParameterMappingDefinition {
    get isInputMapping() {
        return true;
    }
}
