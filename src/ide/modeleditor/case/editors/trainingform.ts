import Definitions from "../../../../repository/deploy/definitions";
import StandardForm from "../../../editors/standardform";
import CaseView from "../elements/caseview";

export default class TrainingForm extends StandardForm {
    instructionText: any;
    /**
     * 
     * This class implements the logic to add setpoints for training the AI model.
     */
    constructor(cs: CaseView) {
        super(cs, 'CMMN Model Training - ' + cs.case.name, 'trainingform');
    }

    renderData() {
        this.htmlContainer?.html(
            `<div class="trainingFormContent">
                <div class="training_content">
                    <label class="trainingFormLabel">Write the AI instruction how you got here</label>
                    <textarea class="instructionContent" rows="10" cols="100"></textarea>
                </div>
                <div>
                    <button class="btn btn-default btnAddSetPoint">Add SetPoint</button>
                </div>
            </div>`);

        this.html.find('.btnAddSetPoint').on('click', () => this.addSetPoint());

        this.instructionText = this.htmlContainer!.find('.instructionContent');

        const model = this.modelEditor.ide.repository.get(this.case.editor.fileName);
    }

    onShow() {
        const deployQuery = 'training=true';
        if (window.location.hash.indexOf(deployQuery) < 0) {
            if (!window.location.hash.endsWith('?')) { // make sure we only add a question mark when it is not yet there.
                window.location.hash = window.location.hash + '?'
            }
            window.location.hash = window.location.hash + deployQuery;
        }
    }

    onHide() {
        window.location.hash = window.location.hash.replace('training=true', '');
        if (window.location.hash.endsWith('?')) window.location.hash = window.location.hash.replace('?', '');
    }

    _setDeployedTimestamp(text: string) {
        this.html.find('.deployed_timestamp').text(text);
    }

    _setContent(label: string, content: string) {
        this.html.find('.deployFormLabel').text(label);
        this.instructionText.val(content);
    }

    _setInstructionTextArea(text: string) {
        this._setContent('Training definition of the CMMN Model', text);
    }

    _setValidationResult(text: string) {
        this._setContent('Server validation messages', text);
    }

    async addSetPoint() {
        const deployment = new Definitions(this.case.caseDefinition);
    
        const instruction = this.instructionText.val() as string;
        const cmmnData = deployment.contents();

        if (!instruction || instruction.trim().length === 0) {
            this._setInstructionTextArea('Please provide an instruction for the training data');
            return;
        }

        await this.modelEditor.ide.training.addSetPointAndSave(this.case.name, cmmnData, instruction).catch(error => {
            console.error('Training add setpoint failed ', error);
            console.groupEnd();
            this._setInstructionTextArea(error.message);
            this._setDeployedTimestamp('');
            this.case.editor.ide.danger('Training for CMMN model ' + this.case.name + ' failed');
        });
        console.groupEnd();
        this.hide();
    }

}
