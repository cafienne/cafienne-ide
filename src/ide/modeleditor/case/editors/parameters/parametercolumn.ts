import CaseParameterDefinition from "../../../../../repository/definition/cmmn/contract/caseparameterdefinition";
import ColumnRenderer, { ColumnConstructor } from "../tableeditor/columnrenderer";
import ParameterRow from "./parameterrow";

export default class ParameterColumn extends ColumnRenderer<CaseParameterDefinition, ParameterRow> {
    constructor(renderer: ColumnConstructor<CaseParameterDefinition, ParameterRow>, tooltip: string = '', label: string = '', width: string = '') {
        super(renderer, tooltip, label, width);
    }

}
