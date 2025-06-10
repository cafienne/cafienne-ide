import CaseParameterDefinition from "../../../../../repository/definition/cmmn/contract/caseparameterdefinition";
import TableRenderer from "../tablerenderer/tablerenderer";
import CaseParametersEditor from "./caseparameterseditor";
import ParameterColumn from "./parametercolumn";
import ParameterRow from "./parameterrow";

export default abstract class ParametersControl extends TableRenderer<CaseParameterDefinition, ParameterRow, ParameterColumn> {
    /**
     * Creates a table to render parameters
     */
    constructor(editor: CaseParametersEditor, htmlParent: JQuery<HTMLElement>) {
        super(editor, htmlParent);
    }

    get parameters(): CaseParameterDefinition[] {
        return this.data;
    }

    refresh() {
        this.editor.refresh();
    }

    addRenderer(parameter: CaseParameterDefinition): ParameterRow {
        return new ParameterRow(this, parameter);
    }
}
