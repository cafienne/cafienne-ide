import StandardForm from "../../../../editors/standardform";
import BottomSplitter from "../../../../splitter/bottomsplitter";
import CaseView from "../../elements/caseview";
import InputParametersControl from "./inputparameterscontrol";
import OutputParametersControl from "./outputparameterscontrol";

export default class CaseParametersEditor extends StandardForm {
    inputParametersControl!: InputParametersControl;
    outputParametersControl!: OutputParametersControl;
    splitter!: BottomSplitter;

    constructor(cs: CaseView) {
        super(cs, 'Edit case parameters', 'caseparameters');
    }

    renderHead() {
        super.renderHead();
        this.htmlContainer?.html(
            `<div class="parameterscontainer">
    <div class="input parameters">
        <h4>Input Parameters</h4>
        <div class="parameterbox input-parameters"></div>
    </div>
    <div class="output parameters">
        <h4>Output Parameters</h4>
        <div class="parameterbox output-parameters"></div>
    </div>
</div>`);
        const inputMappingsContainer = this.htmlContainer!.find('.input-parameters');
        this.inputParametersControl = new InputParametersControl(this, inputMappingsContainer);
        const outputMappingsContainer = this.htmlContainer!.find('.output-parameters');
        this.outputParametersControl = new OutputParametersControl(this, outputMappingsContainer);
        this.splitter = new BottomSplitter(this.htmlContainer!.find('.parameterscontainer')!, 200, 100);
    }

    renderData() {
        this.inputParametersControl.renderTable();
        this.outputParametersControl.renderTable();
    }

    refresh() {
        if (this._html) {
            this.renderForm();
        }
    }
}
