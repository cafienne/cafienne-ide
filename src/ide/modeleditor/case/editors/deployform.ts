import CaseDefinition from "../../../../repository/definition/cmmn/casedefinition";
import Definitions from "../../../../repository/deploy/definitions";
import ServerFile from "../../../../repository/serverfile/serverfile";
import CodeMirrorConfig from "../../../editors/external/codemirrorconfig";
import StandardForm from "../../../editors/standardform";
import Settings from "../../../settings/settings";
import $ajax from "../../../util/ajax";
import CaseCanvas from "../elements/casecanvas";

export default class DeployForm extends StandardForm<CaseDefinition> {
    codeMirrorCaseXML: any;
    /**
     * 
     * This class implements the logic to call the repository REST service to deploy a CMMN model.
     */
    constructor(canvas: CaseCanvas) {
        super(canvas, 'Deploy CMMN Model - ' + canvas.name, 'deployform');
    }

    renderData() {
        this.htmlContainer?.html(
            `<div>
    <div>
        <button class="btn btn-default btnViewCMMN">View CMMN</button>
        <button class="btn btn-default btnDeploy">Deploy</button>
        <button class="btn btn-default btnServerValidation">Server validation</button>

    </div>
    <span class="deployed_timestamp"></span>
    <div style="top:8px;position:relative" title="Click the URL to edit it">
        <label>Server validation goes to</label>
        <input style="border:0px;background-color:inherit" class="serverURL" value="${Settings.serverURL}" type="text"></input>
    </div>
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
        this.html.find('.serverURL').on('change', e => Settings.serverURL = (e.currentTarget as any).value);

        this.codeMirrorCaseXML = CodeMirrorConfig.createXMLEditor(this.htmlContainer!.find('.deployFormContent'));

        const model = this.modelEditor.ide.repository.get(this.canvas.editor.fileName);
        if (model && model.usage.length > 0) {
            const modelRenderer = (file: ServerFile) => `<a href="./#${file.fileName}?deploy=true" title="Click to open the deploy form of ${file.fileName}">${file.name}</a>`;
            const whereUsedCounter = `Case '${this.canvas.caseDefinition.file.name}' is used in ${model.usage.length} other model${model.usage.length == 1 ? '' : 's'}`;
            const whereUsedModels = `${model.usage.map(modelRenderer).join(",&nbsp;&nbsp;")}`;
            this.html.find('.whereUsedContent').html(whereUsedCounter + ": " + whereUsedModels);
        }
    }

    onShow() {
        const deployQuery = 'deploy=true';
        if (window.location.hash.indexOf(deployQuery) < 0) {
            if (!window.location.hash.endsWith('?')) { // make sure we only add a question mark when it is not yet there.
                window.location.hash = window.location.hash + '?'
            }
            window.location.hash = window.location.hash + deployQuery;
        }
    }

    onHide() {
        window.location.hash = window.location.hash.replace('deploy=true', '');
        if (window.location.hash.endsWith('?')) window.location.hash = window.location.hash.replace('?', '');
    }

    _setDeployedTimestamp(text: string) {
        this.html.find('.deployed_timestamp').text(text);
    }

    _setContent(label: string, content: string) {
        this.html.find('.deployFormLabel').text(label);
        this.codeMirrorCaseXML.setValue(content);
        this.codeMirrorCaseXML.refresh();
    }

    _setDeployTextArea(text: string) {
        this._setContent('Deploy definition of the CMMN Model', text);
    }

    _setValidationResult(text: string) {
        this._setContent('Server validation messages', text);
    }

    async deploy() {
        const deployment = new Definitions(this.canvas.caseDefinition);
        await this.modelEditor.ide.repository.deploy(deployment).catch(error => {
            console.error('Deployment failed ', error);
            console.groupEnd();
            this._setDeployTextArea(error.message);
            this._setDeployedTimestamp('');
            this.canvas.editor.ide.danger('Deploy of CMMN model ' + this.canvas.name + ' failed');
        });
        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const msg = 'Deployed at ' + now;

        this._setDeployedTimestamp(msg);
        console.groupEnd();

    }

    viewCMMN() {
        this._setDeployTextArea('Fetching MY CMMN ...');
        const deploy = new Definitions(this.canvas.caseDefinition);
        this._setDeployTextArea(deploy.contents());
    }

    async runServerValidation() {
        console.groupCollapsed('Running server validation')
        const deployment = new Definitions(this.canvas.caseDefinition);
        const data = deployment.contents();
        const url = `${Settings.serverURL}/repository/validate`;
        const type = 'post';
        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/xml'
        }
        this._setValidationResult('Validating ...');
        await $ajax({ url, data, type, headers }).then(data => {
            this._setValidationResult('The model is valid');
            console.groupEnd();
        }).catch((error) => {
            if (error.status === 400) {
                console.groupEnd();
                this._setDeployTextArea(JSON.parse(error.xhr.responseText).join('\n'));
            } else if (error.status === 0) {
                console.groupEnd();
                console.error('Could not run validation', error);
                this._setDeployTextArea('Could not run validation (url: ' + url + ')\n\n' + error.message);
            } else {
                console.groupEnd();
                console.error('Validation failed', error);
                this._setDeployTextArea(error.message);
            }
        });
    }
}
