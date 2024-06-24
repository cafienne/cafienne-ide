import OutputMappingDefinition from "@repository/definition/cmmn/contract/outputmappingdefinition";
import MappingRow from "../mappingrow";

export default class OutputMappingRow extends MappingRow {
    /**
     * @returns {OutputMappingDefinition}
     */
    createElement() {
        return this.taskDefinition.createMapping(OutputMappingDefinition);
    }
}