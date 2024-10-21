import StandardForm from "@ide/editors/standardform";
import { $read, AjaxError } from "@util/ajax";
import CodeMirrorConfig from "@util/codemirrorconfig";
import CaseView from "../elements/caseview";

export default class Deploy extends StandardForm {
    /**
     * 
     * This class implements the logic to call the repository REST service to deploy a CMMN model.
     * @param {CaseView} cs 
     */
    constructor(cs) {
        super(cs, 'Deploy CMMN Model - ' + cs.case.name, 'deployform');
    }

    renderData() {
        this.htmlContainer.html(
`<div>
    <div>
        <button class="btn btn-default btnViewCMMN">View CMMN</button>
        <button class="btn btn-default btnServerValidation">Server validation</button>
        <button class="btn btn-default btnDeploy">Deploy</button>
    </div>
    <span class="deployed_timestamp"></span>
    <div class="where_used_content">
        <br/>
        <div class="whereUsedContent"/>
    </div>
    <div class="deploy_content">
        <label class="deployFormLabel"></label>
        <div class="codeMirrorSource deployFormContent" />
    </div>
</div>`);

        this.html.find('.btnDeploy').on('click', () => this.deploy());
        this.html.find('.btnViewCMMN').on('click', () => this.viewCMMN());
        this.html.find('.btnServerValidation').on('click', () => this.runServerValidation());

        this.codeMirrorCaseXML = CodeMirrorConfig.createXMLEditor(this.htmlContainer.find('.deployFormContent'));

        const model = this.modelEditor.ide.repository.get(this.case.editor.fileName);
        if (model.usage.length > 0) {
            const modelRenderer = e => `<a href="./#${e.id}?deploy=true" title="Click to open the deploy form of ${e.id}">${e.name}</a>`;
            const whereUsedCounter = `Used in ${model.usage.length} other model${model.usage.length == 1 ? '' : 's'}`;
            const whereUsedModels = `${model.usage.map(modelRenderer).join(",&nbsp;&nbsp;")}`;
            this.html.find('.whereUsedContent').html(whereUsedCounter + ": " + whereUsedModels);
        }
    }

    onHide() {
        window.location.hash = window.location.hash.replace('deploy=true', '');
        if (window.location.hash.endsWith('?')) window.location.hash = window.location.hash.replace('?', '');
    }

    _setDeployedTimestamp(text) {
        this.html.find('.deployed_timestamp').text(text);
    }

    _setContent(label, content) {
        this.html.find('.deployFormLabel').text(label);
        this.codeMirrorCaseXML.setValue(content);
        this.codeMirrorCaseXML.refresh();
    }

    _setDeployTextArea(text) {
        this._setContent('Deploy definition of the CMMN Model', text);
    }

    _setValidationResult(text) {
        this._setContent('Server validation messages', text);
    }

    async deploy() {
        // By logging the deploy action in a group, we can see in the console how many times the file has been deployed. UI only shows latest...
        console.group("Deploying case file " + this.case.editor.fileName);
        $read('deploy', this.case.editor.fileName)
            .then(() => {
                const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
                const msg = 'Deployed at ' + now;
                console.log(msg);
                console.groupEnd();
                this._setDeployedTimestamp(msg);
            }).catch((error) => {
                console.groupEnd();
                this._setDeployTextArea(error.message);
                this._setDeployedTimestamp('');
                this.case.editor.ide.danger('Deploy of CMMN model ' + this.case.name + ' failed');
            })
    }

    async viewCMMN() {
        this._setDeployTextArea('Fetching CMMN ...');
        $read('viewCMMN', this.case.editor.fileName)
            .then(data => this._setDeployTextArea((new XMLSerializer()).serializeToString(data)))
            .catch(error => this._setDeployTextArea(error.message));
    }

    async runServerValidation() {
        this._setValidationResult('Validating ...');
        await $read('validate', this.case.editor.fileName)
            .then(data => this._setValidationResult(data.join('\n')))
            .catch(error => this._setValidationResult(error.message));
    }
}
