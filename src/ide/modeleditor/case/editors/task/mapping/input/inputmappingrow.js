import InputMappingDefinition from "@repository/definition/cmmn/contract/inputmappingdefinition";
import MappingRow from "../mappingrow";

export default class InputMappingRow extends MappingRow {
    /**
     * @returns {InputMappingDefinition}
     */
    createElement() {
        return this.taskDefinition.createMapping(InputMappingDefinition);
    }
}
