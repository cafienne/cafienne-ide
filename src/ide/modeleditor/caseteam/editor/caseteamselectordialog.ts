import Dialog from "@ide/editors/dialog";
import CaseView from "@ide/modeleditor/case/elements/caseview";
import CaseTeamRoleDefinition from "@repository/definition/caseteam/caseteamroledefinition";
import CaseTeamModelDefinition from "@repository/definition/caseteam/caseteammodeldefinition";
import CaseTeamFile from "@repository/serverfile/caseteamfile";
import Util from "@util/util";
import $ from "jquery";

export default class TeamSelectorDialog extends Dialog {
    case: CaseView;
    selectedTeam?: CaseTeamFile;
    constructor(cs: CaseView, currentTeam: CaseTeamFile | undefined = undefined) {
        super(cs.editor.ide, 'Select a Case Team');
        this.case = cs;
        this.selectedTeam = currentTeam;
    }

    renderDialog(dialogHTML: JQuery<HTMLElement>) {
        const htmlDialog = $(
            `<form>
                <div class="caseteam-selector">
                    <div class="caseteam-list">
                    </div>
                    <div class="roles-list">
                    </div>
                </div>
                <br/>
                <input type="submit" class='buttonOk' value="OK"/>
                <button class='buttonCancel'>Cancel</button>
            </form>`);
        dialogHTML.append(htmlDialog);
        this.ide.repository.getCaseTeams().forEach(team => this.renderTeam(team, dialogHTML.find('.caseteam-list'), dialogHTML.find('.roles-list')));
        dialogHTML.find('.buttonOk').on('click', e => this.ok());
        dialogHTML.find('.buttonCancel').on('click', e => this.cancel());
        this.renderCaseRoles(this.selectedTeam, dialogHTML.find('.roles-list'));
    }

    renderTeam(team: CaseTeamFile, teamsContainer: JQuery<HTMLElement>, rolesContainer: JQuery<HTMLElement>) {
        const selectedClass = this.selectedTeam == team ? 'caseteam-selected' : '';
        const html = $(
            `<div class='caseteam-container'>
                <div class='caseteam-summary ${selectedClass}'>
                    <img class="caseteam-icon" src="images/roles_128.png" />
                    ${team.name}
                </div>
                <div class="caseteam-children-list"></div>
            </div>`);
        teamsContainer?.append(html);
        html.find('.caseteam-summary').on('click', e => {
            teamsContainer.find('.caseteam-selected').removeClass('caseteam-selected');
            this.selectedTeam = team;
            html.find('.caseteam-summary').addClass('caseteam-selected');
            this.renderCaseRoles(this.selectedTeam, rolesContainer);
        });
        html.find('.caseteam-summary').on('dblclick', e => {
            this.ok();
        });
    }

    renderCaseRoles(team: CaseTeamFile | undefined, rolesContainer: JQuery<HTMLElement>) {
        Util.clearHTML(rolesContainer);
        if (team) {
            team.definition?.roles.forEach(role => this.renderCaseRole(role, rolesContainer));
        }
    }

    renderCaseRole(role: CaseTeamRoleDefinition, container: JQuery<HTMLElement>) {
        const html = $(
            `<div class='caseteam-container'>
                <div class='caseteam-summary'>
                    <img class="caseteam-icon" src="images/svg/blockinghumantaskhalo.svg" />
                    ${role.name}
                </div>
            </div>`);
        container?.append(html);
    }

    ok() {
        super.closeModalDialog(this.selectedTeam);
    }

    cancel() {
        super.closeModalDialog(undefined);
    }
}
