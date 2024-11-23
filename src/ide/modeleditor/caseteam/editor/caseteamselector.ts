import Repository from "../../../../repository/repository";
import CaseTeamFile from "../../../../repository/serverfile/caseteamfile";
import HtmlUtil from "../../../util/htmlutil";

export type Option = {
    option: string,
    value: string
}

export default class CaseTeamSelector {
    caseTeamFiles: CaseTeamFile[];
    listRefresher: (caseTeamRef?: string, additionalOptions?: Option[]) => void;

    constructor(public repository: Repository, public htmlParent: JQuery<HTMLElement>, public caseTeamRef: string, private callback: Function, public additionalOptions: Option[] = []) {
        this.caseTeamFiles = this.repository.getCaseTeams();
        this.loadOptions();
        this.listRefresher = (caseTeamRef = this.caseTeamRef, additionalOptions: Option[] = this.additionalOptions) => {
            // This listRefresher will be executed on each change in the entire repository content 
            // This listRefresher can also be invoked to trigger a refresh after a change
            // Refresh of the HTML content will only occur when a real change is detected
            let refreshOptionsRequired = false;
            const newCaseTeamRef = caseTeamRef;
            const newAdditionalOptions = additionalOptions;
            const newCaseTeamFiles = this.repository.getCaseTeams();

            if (newCaseTeamRef !== this.caseTeamRef) {
                // Detected a change in the current selected team
                this.caseTeamRef = newCaseTeamRef;
                refreshOptionsRequired = true;
            }
            if (JSON.stringify(newAdditionalOptions) !== JSON.stringify(this.additionalOptions)) {
                // Detected a change in the specified additional options
                this.additionalOptions = newAdditionalOptions;
                refreshOptionsRequired = true;
            }
            if (JSON.stringify(newCaseTeamFiles.map(file => file.fileName)) !== JSON.stringify(this.caseTeamFiles.map(file => file.fileName))) {
                // Detected a change in repository content
                this.caseTeamFiles = newCaseTeamFiles;
                refreshOptionsRequired = true;
            }
            if (refreshOptionsRequired) {
                this.loadOptions();
            }
        }
        this.repository.onListRefresh(this.listRefresher);
    }

    loadOptions() {
        HtmlUtil.clearHTML(this.htmlParent);
        this.htmlParent.html(this.getOptions());
        this.htmlParent.val(this.caseTeamRef);
        this.htmlParent.on('change', e => {
            this.caseTeamRef = '' + this.htmlParent.val();
            this.callback(this.caseTeamRef);
        });
    }

    loadRepositoryTypes() {
        return this.caseTeamFiles;
    }

    delete() {
        if (this.listRefresher) {
            this.repository.removeListRefreshCallback(this.listRefresher);
        }
    }

    getOptions() {
        // Create options in this order:
        // - Empty
        // - All additional options (if specified)
        // - All teams in repository
        return `<option value=""></option>${this.additionalOptions.map(o => `<option value="${o.value}">${o.option}</option>`)}${this.caseTeamFiles.map(caseTeam => `<option value="${caseTeam.fileName}">${caseTeam.name}</option>`)}`
    }
}
