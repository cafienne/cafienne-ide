import CaseParameterDefinition from "@repository/definition/cmmn/contract/caseparameterdefinition";
import ParameterMappingDefinition from "@repository/definition/cmmn/contract/parametermappingdefinition";
import ColumnRenderer from "../../../tableeditor/columnrenderer";
import MappingCFI from "../mappingcfi";
import MappingControl from "../mappingcontrol";
import MappingOrderChanger from "../mappingorderchanger";
import InputMappingDeleter from "./inputmappingdeleter";
import InputMappingExpression from "./inputmappingexpression";
import InputMappingRow from "./inputmappingrow";
import InputOperationSelector from "./inputoperationselector";
import InputParameterSelector from "./inputparameterselector";

export default class InputMappingControl extends MappingControl {
    constructor(editor, htmlParent) {
        super(editor, htmlParent);
    }

    /**
     * @returns {Array<CaseParameterDefinition>} The task input parameters (for usage in the parameters editor)
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
