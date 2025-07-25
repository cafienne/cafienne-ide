import "@styles/ide/modeleditors/case/editors/team/caseteameditor.css";
import $ from "jquery";
import CaseTeamModelDefinition from "../../../../../repository/definition/caseteam/caseteammodeldefinition";
import CaseDefinition from "../../../../../repository/definition/cmmn/casedefinition";
import CaseTeamDefinition from "../../../../../repository/definition/cmmn/caseteam/caseteamdefinition";
import ServerFile from "../../../../../repository/serverfile/serverfile";
import XML from "../../../../../util/xml";
import CreateNewModelDialog from "../../../../createnewmodeldialog";
import MovableEditor from "../../../../editors/movableeditor";
import HtmlUtil from "../../../../util/htmlutil";
import Images from "../../../../util/images/images";
import CaseModelEditor from "../../casemodeleditor";
import CaseView from "../../elements/caseview";
import CaseRoleEditor from "./caseroleeditor";
import CaseTeamSelector from "./caseteamselector";

export default class CaseTeamEditor extends MovableEditor {
    caseTeam: CaseTeamDefinition;
    private htmlContainer!: JQuery<HTMLElement>;

    constructor(cs: CaseView) {
        super(cs);
        this.caseTeam = this.case.caseDefinition.caseTeam;
    }

    clear() {
        if (this.htmlContainer) {
            HtmlUtil.clearHTML(this.htmlContainer);
        }
    }

    renderForm() {
        if (!this._html) {
            this.renderHead();
        }
        this.renderData();
    }

    private get removeTooltip(): string {
        const teamFile = this.caseTeam.caseTeamRef.file;
        if (teamFile) {
            const usage = teamFile.usage.filter((file: ServerFile) => file.definition?.id !== this.case.caseDefinition.id);
            return `Remove team...\nTeam ${teamFile.name} is used in ${usage.length} other model${usage.length === 1 ? '' : 's'}\n${usage.length ? usage.map((u: any) => '- ' + u.fileName).join('\n') : ''}`;
        } else {
            return 'Remove team...';
        }
    }

    renderHead() {
        this.html = $(
            `<div element="Case Team Editor" class="basicbox basicform properties caseteam-editor">
                <div class="formheader">
                    <label>${this.label}</label>
                    <div class="formclose">
                        <img src="${Images.Close}" />
                    </div>
                </div>
                <div class="formbody">
                    <div class="caseteam-select">
                        <div class="classic-team">
                            <button class="convert-team">Convert to team structure...</button>
                        </div>
                        <div class="team-management" title="Select a case team with roles which can be assigned to any task in this Case Plan">
                            <label>Case Team</label>
                            <select class="selectTeam"/>
                            <img class="rename-team" title="Rename team..." src="${Images.Rename}" />
                            <img class="remove-team" title="Remove team..." src="${Images.Delete}" />
                            <br/>
                            <br/>
                            <span style="display: inline-block; width: 100%;">
                                <label>Description</label>
                                <input class="teamDocumentation" style="width: 100%"/>
                            </span>
                        </div>
                    </div>
                    <div class="caseteam-grid">
                        <label></label>
                        <label>Role</label>
                        <label>Documentation</label>
                    </div>
                    <div class="formcontainer">
                    </div>
                </div>
            </div>`
        );
        this.htmlParent.append(this.html);
        this.htmlContainer = this.html.find('.formcontainer');

        this.html.find('.formclose').on('click', () => this.hide());
        this.html.draggable({ handle: '.formheader' });
        this.html.resizable();
        // Event handler for classic team
        this.html.find('.convert-team').on('click', () => this.convertTeam());
        // Event handlers for modern team
        const teamSelector = this.html.find('.selectTeam');
        new CaseTeamSelector(this.case.editor.ide.repository, teamSelector, this.caseTeam.caseTeamRef.toString(), (newTeamRef: string) => this.updateCaseTeamReference(newTeamRef), [{ option: '&lt;new&gt;', value: '<new>' }]);
        this.html.find('.rename-team').on('click', () => this.renameTeam());
        this.html.find('.remove-team').on('click', () => this.removeTeam());
        this.html.find('.teamDocumentation').on('change', (e) => {
            this.caseTeam.documentation.text = (e.currentTarget as HTMLInputElement).value;
            this.saveCaseTeam();
        });
    }

    renderData() {
        this.clear();
        if (this.caseTeam.isOldStyle) {
            this.html.find('.classic-team').show();
            this.html.find('.team-management').hide();
        } else {
            this.html.find('.classic-team').hide();
            this.html.find('.team-management').show();
        }

        this.html.find('.selectTeam').val(this.caseTeam.caseTeamRef.toString());
        this.html.find('.teamDocumentation').val(this.caseTeam.documentation.text);
        this.html.find('.removeteam').attr('title', this.removeTooltip);

        if (this.caseTeam.isOldStyle || !this.caseTeam.caseTeamRef.isEmpty) {
            this.caseTeam.roles.forEach(role => new CaseRoleEditor(this, this.htmlContainer, role));
            this.addEmptyRoleRenderer();
        }
    }

    addEmptyRoleRenderer() {
        new CaseRoleEditor(this, this.htmlContainer);
    }

    get label(): string {
        return 'Case Team Roles';
    }

    async convertTeam(): Promise<void> {
        // prefix the case team name with 'case_' ... but only on the last part of the name, to create it in the same folder as the case
        const path = this.case.name.split('/');
        path[path.length - 1] = 'case_' + path[path.length - 1];
        const teamName = path.join('/');
        const teamFileName = teamName + '.caseteam';
        const teamFile = this.modelEditor.ide.repository.createCaseTeamFile(teamFileName, CaseTeamModelDefinition.createDefinitionSource(teamName));
        if (!teamFile.definition) {
            // This would be weird.
            throw new Error("Failed to create case team model definition");
        }

        // Add existing roles to the new case team and save the new team
        const newTeamDefinition: CaseTeamModelDefinition = teamFile.definition;
        this.caseTeam.roles.forEach((role) => newTeamDefinition.createCaseRole(role.name, role.id, role.documentation.text));
        this.caseTeam.roles = [];
        teamFile.source = newTeamDefinition.toXML();
        await teamFile.save();

        // Now update the case to point to the new case team
        this.updateCaseTeamReference(teamFileName);

        // And finally: refresh the screen
        this.renderData();
    }

    async renameTeam(): Promise<void> {
        if (!this.caseTeam.caseTeamRef.file) return;
        await this.modelEditor.ide.repositoryBrowser.rename(this.caseTeam.caseTeamRef.file);
    }

    async removeTeam(): Promise<void> {
        if (!this.caseTeam.caseTeamRef.file) return;

        const teamFile = this.caseTeam.caseTeamRef.file;

        // clear reference from case
        this.caseTeam.caseTeamRef.update('');
        this.case.editor.completeUserAction();

        // try to delete, will succeed only when this was the last reference
        await this.modelEditor.ide.repositoryBrowser.delete(teamFile);
    }

    updateCaseTeamReference(caseTeamRef: string) {
        if (caseTeamRef === "<new>") {
            this.openCreateCaseTeamModelDialog();
        } else {
            this.caseTeam.changeCaseTeam(caseTeamRef);
            this.case.editor.completeUserAction();
            if (this.caseTeam.caseTeamRef.getDefinition()) {
                this.renderData();
            } else {
                this.clear();
            }
        }
    }

    async saveCaseTeam() {
        this.case.editor.completeUserAction();
        const team = this.caseTeam.caseTeamRef.getDefinition();
        if (team) {
            const file = team.file;
            const oldSource = XML.prettyPrint(file.source);
            const newSource = XML.prettyPrint(team.toXML());
            file.source = newSource;
            if (oldSource !== newSource) {
                await file.save();
                file.usage
                    .filter(f => f.definition instanceof CaseDefinition)
                    .map(file => this.case.editor.ide.editorRegistry.get(file))
                    .filter(caseEditor => caseEditor !== undefined).map(caseEditor => <CaseModelEditor>caseEditor)
                    .filter(caseEditor => caseEditor.case?.teamEditor.visible && caseEditor.case.teamEditor !== this)
                    .forEach(caseEditor => {
                        // console.log("Refreshing team in case " + caseEditor.file.fileName);
                        caseEditor.case?.teamEditor.renderData();
                    });
            }
        }
    }

    async openCreateCaseTeamModelDialog(): Promise<void> {
        const filetype = 'caseteam';
        const text = `Create a new case team`;
        const ide = this.case.editor.ide;
        if (!ide) return;
        const dialog = new CreateNewModelDialog(ide, text);
        dialog.showModalDialog(async (newModelInfo: any) => {
            if (newModelInfo) {
                const newModelName = newModelInfo.name;
                if (!ide.repositoryBrowser.isValidEntryName(newModelName)) {
                    return;
                }

                const fileName = newModelName + "." + filetype;
                if (ide.repository.hasFile(fileName)) {
                    ide.danger("A " + filetype + " with this name already exists and cannot be overwritten", 5000);
                    return;
                }

                const file = ide.repository.createCaseTeamFile(fileName, CaseTeamModelDefinition.createDefinitionSource(newModelName, newModelInfo.description));
                await file.save();
                this.updateCaseTeamReference(fileName);
            } else {
                this.renderData();
            }
        });
    }

    deleteCaseTeam() {
        const file = this.caseTeam.caseTeamRef.file;
        if (file) {
            this.updateCaseTeamReference('');
            window.setTimeout(() => {
                if (file.usage.length) {
                    this.case.editor.ide.warning(
                        `Case team '${file.fileName}' is still used in ${file.usage.length} other model${file.usage.length === 1 ? '' : 's'
                        }\n${file.usage.length ?
                            file.usage.map((u: any) => '- ' + u.fileName).join('\n')
                            : ''
                        }`, 5000
                    );
                } else {
                    const text = `This case team is not used anymore in other case models, Do you want to delete '${file.fileName}'? (Cancel to keep)`;
                    if (confirm(text) === true) {
                        this.case.editor.ide.repository.delete(file.fileName);
                    }
                }
            }, 0);
        }
    }
}
