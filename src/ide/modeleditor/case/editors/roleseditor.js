import $ from "jquery";
import CaseTeamModelDefinition from "../../../../repository/definition/caseteam/caseteammodeldefinition";
import CaseTeamRoleDefinition from "../../../../repository/definition/caseteam/caseteamroledefinition";
import CaseRoleDefinition from "../../../../repository/definition/cmmn/caseteam/caseroledefinition";
import CaseTeamFile from "../../../../repository/serverfile/caseteamfile";
import XML from "../../../../util/xml";
import CreateNewModelDialog from "../../../createnewmodeldialog";
import MovableEditor from "../../../editors/movableeditor";
import HtmlUtil from "../../../util/htmlutil";
import Images from "../../../util/images/images";
import CaseTeamSelector from "../../caseteam/editor/caseteamselector";

export default class RolesEditor extends MovableEditor {

    clear() {
        if (this.htmlContainer) {
            HtmlUtil.clearHTML(this.htmlContainer);
        }
    }    

    renderForm() {
        if (!this._html) {
            this.renderHead();
            this.addCaseTeamSelector();
        }
        this.renderData();
    }

    renderHead() {
        this.html = $(
            `<div element="Case Team" id="${this.id}" class="basicbox basicform properties roles-editor">
                <div class="formheader">
                    <label>${this.label}</label>
                    <div class="formclose">
                        <img src="${Images.Close}" />
                    </div>
                </div>
                <div class="caseteam-select">
                </div>
                <div class="caseteam-grid">
                    <label></label>
                    <label>Role</label>
                    <label>Documentation</label>
                </div>
                <div class="formcontainer">
                </div>
            </div>`
        );
        this.htmlParent.append(this.html);
        this.htmlContainer = this.html.find('.formcontainer');
        
        // add the event handles, for adding and removing data at top level
        this.html.find('.formclose').on('click', e => this.hide());
        //make the editor draggable
        this.html.draggable({ handle: '.formheader' });
        this.html.resizable();
    }

    renderData() {
        this.clear();
        this.roleRenderers = [];
        this.data.forEach(role => {
            this.roleRenderers.push(new RoleRenderer(this, role));
        });
        this.roleRenderers.forEach(roleRenderer => {
            this.htmlContainer.append(roleRenderer.html);
        });
        this.addEmptyRoleRenderer();
    }

    addEmptyRoleRenderer() {
        const definition = this.case.caseDefinition.caseTeam.caseTeamRef.getDefinition();
        if (this.case.caseDefinition.caseTeam.isOldStyle || definition) {
            const emptyRoleRenderer = new RoleRenderer(this);
            this.roleRenderers.push(emptyRoleRenderer);
            this.htmlContainer.append(emptyRoleRenderer.html);
        }
    }

    get label() {
        return 'Case Team Roles';
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

    addCaseTeamSelector() {
        if (this.case.caseDefinition.caseTeam.isOldStyle) {
            this.html.find('.caseteam-select').hide();
            return;
        }
        const html = $(`<div title="Select a case team with roles which can be assigned to any task in this Case Plan">
                            <label>Case Team</label>
                            <select class="selectTeam">
                            </select>
                        </div>`);
        new CaseTeamSelector(this.case.editor.ide.repository, html.find('.selectTeam'), this.case.caseDefinition.caseTeam.caseTeamRef.toString(), (v) => {
            if (v == "<new>") {
                html.find('.selectTeam').val(this.case.caseDefinition.caseTeam.caseTeamRef.toString()); // Reset to current value;
                this.openCreateCaseTeamModelDialog();
            } else {
                this.updateCaseTeam(v);
            }
        }, [{ option: '&lt;new&gt;', value: '<new>' }]);
        this.html.find('.caseteam-select').show();
        this.html.find('.caseteam-select').append(html);
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
        } else {
            this.clear();
        }
    }

    /**
     * Save changes in the CaseTeamFile definition (if any);
     */
    async saveCaseTeam() {
        this.case.editor.completeUserAction();
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

export class RoleRenderer {
    /**
     * @param {RolesEditor} editor  
     * @param {CaseRoleDefinition|CaseTeamRoleDefinition} role 
     */
    constructor(editor, role = undefined) {
        this.rolesEditor = editor;
        this.role = role;
        const roleName = role ? role.name : '';
        const roleDocumentation = role ? role.documentation.text : '';
        this.html = $(
            `<div class="caseteam-grid">
                <button title="Remove role..." class="btnDelete"><img src="${Images.Delete}" /></button>
                <input class="inputRoleName" type="text" value="${roleName}"></input>
                <input class="inputDocumentation" type="text" value="${roleDocumentation}"></input>
            </div>`);
                        
        this.html.find('.btnDelete').on('click', e => {
            this.delete(e);
            this.rolesEditor.saveCaseTeam();
        });
        this.html.find('.inputRoleName').on('change', e => {
            if (!this.role) {
                this.role = this.addNewRoleDefinition();
            }
            this.role.change('name', e.currentTarget.value);
            this.rolesEditor.case.refreshReferencingFields(this.role);
            this.rolesEditor.saveCaseTeam();
        });
        this.html.find('.inputDocumentation').on('change', e => {
            if (!this.role) {
                this.role = this.addNewRoleDefinition();
            }
            this.role.documentation.text = e.currentTarget.value;
            this.rolesEditor.saveCaseTeam();
        });
    }

    delete(e) {
        e.stopPropagation();
        if (!this.role) return;
        // Ask whether our element is in use by someone else, before it can be deleted.
        if (this.rolesEditor.case.items.find(item => item.referencesDefinitionElement(this.role.id))) {
            this.rolesEditor.case.editor.ide.danger('The role is in use, it cannot be deleted');
        } else {
            // delete the role
            Util.removeHTML(this.html);
            this.role.removeDefinition();
        }
    }

    /**
     * @returns {CaseRoleDefinition|CaseTeamRoleDefinition}
     */
    addNewRoleDefinition() {
        var newRole;
        if (this.rolesEditor.case.caseDefinition.caseTeam.isOldStyle) {
            newRole = this.rolesEditor.case.caseDefinition.createDefinition(CaseRoleDefinition);
        } else {
            newRole = this.rolesEditor.case.caseDefinition.caseTeam.caseTeamRef.getDefinition().createDefinition(CaseTeamRoleDefinition);
        }
        this.rolesEditor.data.push(newRole);
        this.rolesEditor.addEmptyRoleRenderer();
        return newRole;
    }
}
