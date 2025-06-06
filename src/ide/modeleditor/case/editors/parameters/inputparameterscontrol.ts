import CaseParametersEditor from "./caseparameterseditor";
import CFIZoom from "./cfizoom";
import ExpressionChanger from "./expressionchanger";
import NameChanger from "./namechanger";
import ParameterColumn from "./parametercolumn";
import ParameterDeleter from "./parameterdeleter";
import ParametersControl from "./parameterscontrol";

export default class InputParametersControl extends ParametersControl {
    constructor(editor: CaseParametersEditor, htmlParent: JQuery<HTMLElement>) {
        super(editor, htmlParent);
    }

    get columns() {
        return [
            new ParameterColumn(ParameterDeleter),
            new ParameterColumn(NameChanger),
            new ParameterColumn(ExpressionChanger, 'The transformation that is executed while binding parameter to the case file item'),
            new ParameterColumn(CFIZoom, 'The case file item that binds to the parameter.\nAn empty binding means the parameter will not be used.')
        ];
    }

    get data() {
        return this.case.caseDefinition.input;
    }
}
