import CaseRoleDefinition from "@definition/cmmn/caseteam/caseroledefinition";
import TableEditor, { RowEditor, TableEditorColumn } from "./tableeditor/tableeditor";
import $ from "jquery";

export default class RolesEditor extends TableEditor {
    get label() {
        return 'Roles';
    }

    /** @returns {Array<TableEditorColumn>} */
    get columns() {
        return [
            new TableEditorColumn('', '20px', 'Delete the role'),
            new TableEditorColumn('Role', '200px', 'The name of the role'),
            new TableEditorColumn('Documentation', '', 'Documentation for the role')
        ];
    }

    /** @returns {Array<CaseRoleDefinition>} */
    get data() {
        return this.case.caseDefinition.caseTeam.roles;
    }

    /**
     * 
     * @param {CaseRoleDefinition} role 
     * @returns {RoleRenderer}
     */
    addRenderer(role = undefined) {
        return new RoleRenderer(this, role);
    }

    /**
     * validates this
     */
    validate() {
        // Throw an error for each role that has no name
        this.data.filter(role => !role.name).forEach(role => this.raiseEditorIssue(role, 1, ['role', this.case.name, role.documentation.text]));
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
                        
        this.html.find('.inputRoleName').on('change', e => {
            this.change('name', e.currentTarget.value);
            editor.case.refreshReferencingFields(this.element);
        });
        this.html.find('.inputDocumentation').on('change', e => {
            this.element.documentation.text = e.currentTarget.value;
            editor.case.editor.completeUserAction();
        });
    }

    /**
     * @returns {CaseRoleDefinition}
     */
    createElement() {
        const newRole = this.editor.case.caseDefinition.createDefinition(CaseRoleDefinition);
        return newRole;
    }
}
