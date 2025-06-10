import CaseParameterDefinition from "../../../../../repository/definition/cmmn/contract/caseparameterdefinition";
import ColumnRenderer, { CellRendererClassType } from "../tablerenderer/columnrenderer";
import ParameterRow from "./parameterrow";

export default class ParameterColumn extends ColumnRenderer<CaseParameterDefinition, ParameterRow> {
    constructor(renderer: CellRendererClassType<CaseParameterDefinition, ParameterRow>, tooltip: string = '', label: string = '', width: string = '') {
        super(renderer, tooltip, label, width);
    }

}
