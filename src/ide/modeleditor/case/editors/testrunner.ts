import Repository from "../../../../repository/repository";
import { Runner } from "../../../../testharness/runner/runner";
import StandardForm from "../../../editors/standardform";
import CaseCanvas from "../elements/casecanvas";

export default class TestRunner extends StandardForm {
    runner: Runner

    /**
     * 
     * This class implements the logic to call the repository REST service to test a CMMN model.
     */
    constructor(public caseCanvas: CaseCanvas) {
        super(caseCanvas, `Run testcases for  CMMN Model - '${caseCanvas.name}'`, 'testform');

        this.runner = new Runner(caseCanvas.caseDefinition.file.repository as Repository);
    }

    renderData(): void {
        super.renderData();

        if (this.htmlContainer) {
            this.htmlContainer.html(
                `<div>
                    <div>
                        <button class="btn btn-default btnRun">Run testcases</button>
                    </div>
                    <span class="tested_timestamp"></span>
                    <div class="testresults">
                        <label class="testFormLabel"></label>
                        <div class="codeMirrorSource" />
                    </div>
                </div>`);

            this.html.find('.btnRun').on('click', () => this.run());
        }
    }

    onShow(): void {
        const testQuery = 'test=true';
        if (window.location.hash.indexOf(testQuery) < 0) {
            if (!window.location.hash.endsWith('?')) { // make sure we only add a question mark when it is not yet there.
                window.location.hash = window.location.hash + '?'
            }
            window.location.hash = window.location.hash + testQuery;
        }
    }

    onHide() {
        window.location.hash = window.location.hash.replace('test=true', '');
        if (window.location.hash.endsWith('?')) window.location.hash = window.location.hash.replace('?', '');
    }

    _settestedTimestamp(text: string) {
        this.html.find('.tested_timestamp').text(text);
    }

    async run(): Promise<void> {
        this._settestedTimestamp('Running testcases ...');

        await this.runner.runTestForCase(this.caseCanvas.caseDefinition)
            .then((result: string) => { this._settestedTimestamp('Testcases ran successfully') })
            .catch((error: Error) => { this._settestedTimestamp('Error running testcases') });
    }
}
