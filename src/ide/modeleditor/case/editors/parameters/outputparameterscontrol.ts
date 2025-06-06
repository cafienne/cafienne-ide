import CaseParametersEditor from "./caseparameterseditor";
import CFIZoom from "./cfizoom";
import ExpressionChanger from "./expressionchanger";
import NameChanger from "./namechanger";
import ParameterColumn from "./parametercolumn";
import ParameterDeleter from "./parameterdeleter";
import ParametersControl from "./parameterscontrol";

export default class OutputParametersControl extends ParametersControl {
    constructor(editor: CaseParametersEditor, htmlParent: JQuery<HTMLElement>) {
        super(editor, htmlParent);
    }

    get columns() {
        return [
            new ParameterColumn(ParameterDeleter),
            new ParameterColumn(NameChanger),
            new ParameterColumn(ExpressionChanger, 'The transformation that is executed while binding the case file item to the parameter'),
            new ParameterColumn(CFIZoom, 'The case file item that is used to fill the output parameter.\nAn empty binding means the parameter will be filled with the outcome of the expression.')
        ];
    }

    get data() {
        return this.case.caseDefinition.output;
    }
}
