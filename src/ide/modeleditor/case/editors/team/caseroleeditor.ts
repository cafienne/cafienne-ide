import $ from "jquery";
import CaseRoleDefinition from "../../../../../repository/definition/cmmn/caseteam/caseroledefinition";
import HtmlUtil from "../../../../util/htmlutil";
import Images from "../../../../util/images/images";
import CaseTeamEditor from "./caseteameditor";

export default class CaseRoleEditor {
    html: JQuery<HTMLElement>;

    constructor(private teamEditor: CaseTeamEditor, private htmlParent: JQuery<HTMLElement>, private role?: CaseRoleDefinition) {
        const roleName = role ? role.name : '';
        const roleDocumentation = role ? role.documentation.text : '';
        this.html = $(
            `<div class="caseteam-grid">
                <button title="Remove role..." class="btnDelete"><img src="${Images.Delete}" /></button>
                <input class="inputRoleName" type="text" value="${roleName}"></input>
                <input class="inputDocumentation" type="text" value="${roleDocumentation}"></input>
            </div>`);

        this.html.find('.btnDelete').on('click', (e) => {
            this.deleteRole(e);
            this.teamEditor.saveCaseTeam();
        });
        this.html.find('.inputRoleName').on('change', (e) => {
            if (!this.role) {
                this.role = this.addNewRoleDefinition();
            }
            this.role.change('name', (e.currentTarget as HTMLInputElement).value);
            this.teamEditor.canvas.refreshReferencingFields(this.role);
            this.teamEditor.saveCaseTeam();
        });
        this.html.find('.inputDocumentation').on('change', (e) => {
            if (!this.role) {
                this.role = this.addNewRoleDefinition();
            }
            this.role.documentation.text = (e.currentTarget as HTMLInputElement).value;
            this.teamEditor.saveCaseTeam();
        });
        this.htmlParent.append(this.html);
    }

    private deleteRole(e: JQuery.ClickEvent): void {
        e.stopPropagation();
        if (!this.role) return;
        // Ask whether our element is in use by someone else, before it can be deleted.
        if (this.teamEditor.canvas.items.find(item => item.referencesDefinitionElement(this.role!.id))) {
            this.teamEditor.canvas.editor.ide.danger('The role is in use, it cannot be deleted');
        } else {
            // delete the role
            HtmlUtil.removeHTML(this.html);
            this.role.removeDefinition();
        }
    }

    /**
     * @returns {CaseRoleDefinition}
     */
    private addNewRoleDefinition(): CaseRoleDefinition {
        const newRole = this.teamEditor.caseTeam.createRole();
        this.teamEditor.addEmptyRoleRenderer();
        return newRole;
    }
}
