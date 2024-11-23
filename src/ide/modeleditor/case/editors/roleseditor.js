import CreateNewModelDialog from "@ide/createnewmodeldialog";
import CaseTeamSelector from "@ide/modeleditor/caseteam/editor/caseteamselector";
import CaseTeamModelDefinition from "@repository/definition/caseteam/caseteammodeldefinition";
import CaseTeamRoleDefinition from "@repository/definition/caseteam/caseteamroledefinition";
import CaseRoleDefinition from "@repository/definition/cmmn/caseteam/caseroledefinition";
import CaseTeamFile from "@repository/serverfile/caseteamfile";
import XML from "@util/xml";
import $ from "jquery";
import TableEditor, { RowEditor, TableEditorColumn } from "./tableeditor/tableeditor";

export default class RolesEditor extends TableEditor {
    get label() {
        return 'Case Team Roles';
    }

    /** @returns {Array<TableEditorColumn>} */
    get columns() {
        return [
            new TableEditorColumn('', '20px', 'Delete the role'),
            new TableEditorColumn('Role', '200px', 'The name of the role'),
            new TableEditorColumn('Documentation', '', 'Documentation for the role')
        ];
    }

    /** @returns {Array<CaseRoleDefinition|CaseTeamRoleDefinition>} */
    get data() {
        const definition = this.case.caseDefinition.caseTeam.caseTeamRef.getDefinition();
        if (this.case.caseDefinition.caseTeam.isOldStyle || !definition) {
            return this.case.caseDefinition.caseTeam.roles;
        } else {
            return definition.roles
        }
    }

    /**
     * 
     * @param {CaseRoleDefinition} role 
     * @returns {RoleRenderer}
     */
    addRenderer(role = undefined) {
        if (!this.case.caseDefinition.caseTeam.isOldStyle) {
            if (this.html.find(".selectTeam").length == 0) {
                this.addCaseTeamSelector();
            }
            if (!this.case.caseDefinition.caseTeam.caseTeamRef.getDefinition()) {
                this.clear();
                this.html.find('table').hide();
                return undefined;
            }
        }
        return new RoleRenderer(this, role);
    }

    addCaseTeamSelector() {
        const html = $(`<div title="Select a case team with roles which can be assigned to any task in this Case Plan">
                            <button title="Remove case team..." class="btnDelete" ><img src="images/delete_32.png" /></button>
                            <select class="selectTeam" style="width:calc(100% - 26px)">
                            </select>
                        </div>`);
        html.find('.btnDelete').on('click', e => {
            this.deleteCaseTeam();
        });
        new CaseTeamSelector(this.case.editor.ide.repository, html.find('.selectTeam'), this.case.caseDefinition.caseTeam.caseTeamRef.toString(), (v) => {
            if (v == "<new>") {
                html.find('.selectTeam').val(this.case.caseDefinition.caseTeam.caseTeamRef.toString()); // Reset to current value;
                this.openCreateCaseTeamModelDialog();
            } else {
                this.updateCaseTeam(v);
            }
        }, [{ option: '&lt;new&gt;', value: '<new>' }]);
        this.htmlContainer.parent().parent().prepend(html);
        html.find('.selectTeam').val(this.case.caseDefinition.caseTeam.caseTeamRef.toString());
        return html;
    }

    /**
     * validates this
     */
    validate() {
        // Throw an error for each role that has no name
        this.data.filter(role => !role.name).forEach(role => this.raiseEditorIssue(role, 1, ['role', this.case.name, role.documentation.text]));
    }

    updateCaseTeam(caseTeamRef) {
        this.case.caseDefinition.caseTeam.caseTeamRef.update(caseTeamRef);
        this.case.editor.completeUserAction();
        this.html.find('.selectTeam').val(this.case.caseDefinition.caseTeam.caseTeamRef.toString());
        this.refreshRolesOnCaseTeam();
        if (this.case.caseDefinition.caseTeam.caseTeamRef.getDefinition()) {
            this.renderData();
            this.html.find('table').show();
        } else {
            this.clear();
            this.html.find('table').hide();
        }
    }

    /**
     * Save changes in the CaseTeamFile definition (if any);
     */
    async saveCaseTeam() {
        if (!this.case.caseDefinition.caseTeam.isOldStyle) {
            if (this.case.caseDefinition.caseTeam.caseTeamRef.getDefinition()) {
                /** @type {CaseTeamFile} */ 
                let file = this.case.caseDefinition.caseTeam.caseTeamRef.file;
                var oldSource = XML.prettyPrint(file.source);
                file.source = file.definition.toXML();
                if (oldSource != XML.prettyPrint(file.source)) {
                    // If there are changes in the definition
                    await file.save();
                    this.refreshRolesOnCaseTeam();
                }
            }
        }
    }

    refreshRolesOnCaseTeam() {
        this.case.caseDefinition.caseTeam.roles = [];
        this.case.caseDefinition.caseTeam.resolvedExternalReferences();
    }

    async openCreateCaseTeamModelDialog() {
        const filetype = 'caseteam';
        const text = `Create a new case team`;
        const ide = this.case.editor.ide;
        if (!ide) return;
        const dialog = new CreateNewModelDialog(ide, text);
        dialog.showModalDialog(async (newModelInfo) => {
            if (newModelInfo) {
                const newModelName = newModelInfo.name;

                // Check if a valid name is used
                if (!ide.repositoryBrowser.isValidEntryName(newModelName)) {
                    return;
                }

                const fileName = newModelName + '.' + filetype;
                if (ide.repository.hasFile(fileName)) {
                    ide.danger('A ' + filetype + ' with this name already exists and cannot be overwritten', 5000);
                    return;
                }

                const file = ide.repository.createCaseTeamFile(fileName, CaseTeamModelDefinition.createDefinitionSource(newModelName));
                await file.save();
                await file.parse();
                this.updateCaseTeam(fileName);
            };
        });
    }

    deleteCaseTeam() {
        const file = this.case.caseDefinition.caseTeam.caseTeamRef.file;
        if (file) {
            this.updateCaseTeam('');
            window.setTimeout(() => {
                if (file.usage.length) {
                    this.case.editor.ide.warning(`Case team '${file.fileName}' is still used in ${file.usage.length} other model${file.usage.length == 1 ? '' : 's'}\n${file.usage.length ? file.usage.map(u => '- ' + u.fileName).join('\n') : ''}`, 5000);
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

export class RoleRenderer extends RowEditor {
    /**
     * @param {RolesEditor} editor 
     * @param {CaseRoleDefinition} role 
     */
    constructor(editor, role = undefined) {
        super(editor, role);
        const roleName = role ? role.name : '';
        const roleDocumentation = role ? role.documentation.text : '';
        this.html = $(`<tr class="case-team-role">
                            <td><button class="btnDelete"><img src="images/delete_32.png" /></button></td>
                            <td><input class="inputRoleName" type="text" value="${roleName}" /></td>
                            <td><input class="inputDocumentation" type="text" value="${roleDocumentation}" /></td>
                        </tr>`);
                        
        this.html.find('.btnDelete').on('click', e => {
            editor.saveCaseTeam();
        });
        this.html.find('.inputRoleName').on('change', e => {
            this.change('name', e.currentTarget.value);
            editor.case.refreshReferencingFields(this.element);
            editor.saveCaseTeam();
        });
        this.html.find('.inputDocumentation').on('change', e => {
            this.element.documentation.text = e.currentTarget.value;
            editor.case.editor.completeUserAction();
            editor.saveCaseTeam();
        });
    }

    /**
     * @returns {CaseRoleDefinition|CaseTeamRoleDefinition}
     */
    createElement() {
        var newRole;
        if (this.case.caseDefinition.caseTeam.isOldStyle) {
            newRole = this.editor.case.caseDefinition.createDefinition(CaseRoleDefinition);
        } else {
            newRole = this.editor.case.caseDefinition.caseTeam.caseTeamRef.getDefinition().createDefinition(CaseTeamRoleDefinition);
        }
        return newRole;
    }
}
