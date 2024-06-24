import ParameterDefinition from "@repository/definition/cmmn/contract/parameterdefinition";
import MappingControl from "../mappingcontrol";
import ParameterMappingDefinition from "@repository/definition/cmmn/contract/parametermappingdefinition";
import InputMappingDeleter from "./inputmappingdeleter";
import MappingCFI from "../mappingcfi";
import InputOperationSelector from "./inputoperationselector";
import InputParameterSelector from "./inputparameterselector";
import MappingOrderChanger from "../mappingorderchanger";
import InputMappingExpression from "./inputmappingexpression";
import InputMappingRow from "./inputmappingrow";

export default class InputMappingControl extends MappingControl {
    constructor(editor, htmlParent) {
        super(editor, htmlParent);
    }

    /**
     * @returns {Array<ParameterDefinition>} The task input parameters (for usage in the parameters editor)
     */
    get parameters() {
        return this.taskDefinition.inputs;
    }

    get data() {
        return this.taskDefinition.inputMappings;
    }

    get columns() {
        return [
            new ColumnRenderer(InputMappingDeleter),
            new ColumnRenderer(MappingCFI, 'Case File Item that binds to the input parameter of the task'),
            new ColumnRenderer(InputOperationSelector),
            new ColumnRenderer(InputMappingExpression),
            new ColumnRenderer(InputParameterSelector),
            new ColumnRenderer(MappingOrderChanger)
        ];
    }

    /**
     * 
     * @param {ParameterMappingDefinition} mapping 
     */
    addRenderer(mapping = undefined) {
        if (mapping) {
            return new InputMappingRow(this, mapping);
        }
    }
}
