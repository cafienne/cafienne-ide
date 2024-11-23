import $ from "jquery";
import CreateNewModelDialog from "../../createnewmodeldialog";
import IDE from "../../ide";
import TypeSelector, { Option } from "../type/editor/typeselector";
import CaseTeamSelector from "../caseteam/editor/caseteamselector";

export default class CreateNewCaseModelDialog extends CreateNewModelDialog {
    typeRef: string = '';
    caseTeamRef: string = '';
    typeSelector?: TypeSelector;
    caseTeamSelector?: CaseTeamSelector;

    constructor(ide: IDE, label: string) {
        super(ide, label);
    }

    renderDialog(dialogHTML: JQuery<HTMLElement>) {
        const htmlDialog = $(`
            <form>
                <label style="width:150px">Name</label><input class = "inputName" value="">
                <br>
                <label style="width:150px">Description</label><input class = "inputDescription"/>
                <br>
                <label style="width:150px">Type</label><select class="selectType"></select>
                <br>
                <label style="width:150px">Case Team</label><select class="selectCaseTeam"></select>
                <br>
                <br>
                <input style="background-color:steelblue; color:#fff" type="submit" class='buttonOk' value="OK"/>
                <button class='buttonCancel'>Cancel</button>
            </form>
        `);
        dialogHTML.append(htmlDialog);
        dialogHTML.find('input').on('focus', e => e.target.select());
        dialogHTML.find('.inputName').on('change', e => {
            this.typeRef = this.deriveTypeRefFromCaseName(this.readResult(dialogHTML).name); // The typeRef is the fileName including the extension ".type"
            this.typeSelector?.listRefresher(this.typeRef, this.createOptionalNewTypeOption(this.readResult(dialogHTML).name));
            this.caseTeamRef = this.deriveCaseTeamRefFromCaseName(this.readResult(dialogHTML).name); // The caseTeamRef is the fileName including the extension ".caseteam"
            this.caseTeamSelector?.listRefresher(this.caseTeamRef, this.createOptionalNewCaseTeamOption(this.readResult(dialogHTML).name));
        });
        dialogHTML.find('.buttonOk').on('click', e => this.closeModalDialog(this.createResult(dialogHTML)));
        dialogHTML.find('.buttonCancel').on('click', e => this.closeModalDialog(false));
        this.typeSelector = new TypeSelector(this.ide.repository, dialogHTML.find('.selectType'), this.typeRef, (v: string) => this.typeRef = v, false);
        this.caseTeamSelector = new CaseTeamSelector(this.ide.repository, dialogHTML.find('.selectCaseTeam'), this.caseTeamRef, (v: string) => this.caseTeamRef = v);
    }

    createResult(dialogHTML: JQuery<HTMLElement>) {
        const result = super.readResult(dialogHTML);
        (result as any).typeRef = this.typeRef;
        (result as any).caseTeamRef = this.caseTeamRef;
        return result;
    }

    /**
     * Create an additional <new> option when typeRef doesn't already exists
     */
    createOptionalNewTypeOption(caseName: string): Option[] {
        if (this.typeRef) {
            // Search (case-insensitive) for an existing type with matching typeRef (including extension '.type')
            const types = this.ide.repository.getTypes();
            if (types.findIndex(typeFile => this.typeRef.toLocaleLowerCase() === typeFile.fileName.toLocaleLowerCase()) < 0) {
                return [{ option: `&lt;new&gt; ${caseName}`, value: this.typeRef }];
            }
        }
        return [];
    }

    /**
     * Create an additional <new> option when caseTeamRef doesn't already exists
     */
    createOptionalNewCaseTeamOption(caseName: string): Option[] {
        if (this.caseTeamRef) {
            // Search (case-insensitive) for an existing case team with matching caseTeamRef (including extension '.caseteam')
            const caseTeams = this.ide.repository.getCaseTeams();
            if (caseTeams.findIndex(caseTeamFile => this.typeRef.toLocaleLowerCase() === caseTeamFile.fileName.toLocaleLowerCase()) < 0) {
                return [{ option: `&lt;new&gt; ${caseName}`, value: this.caseTeamRef }];
            }
        }
        return [];
    }

    /**
     * Returns a case sensitive typeRef when found in repository or construct a new typeRef
     */
    deriveTypeRefFromCaseName(caseName: string): string {
        if (caseName) {
            // Search (case-insensitive) for an existing type with matching name (excluding the extension '.type')
            const types = this.ide.repository.getTypes();
            const typeIndex = types.findIndex(typeFile => caseName.toLocaleLowerCase() === typeFile.name.toLocaleLowerCase());
            if (typeIndex >= 0) {
                return types[typeIndex].fileName;
            } else {
                return caseName + '.type';
            }
        }
        return '';
    }

    /**
     * Returns a case sensitive caseTeamRef when found in repository or construct a new caseTeamRef
     */
    deriveCaseTeamRefFromCaseName(caseName: string): string {
        if (caseName) {
            // Search (case-insensitive) for an existing case team with matching name (excluding the extension '.caseteam')
            const caseTeams = this.ide.repository.getCaseTeams();
            const caseTeamIndex = caseTeams.findIndex(caseTeamFile => caseName.toLocaleLowerCase() === caseTeamFile.name.toLocaleLowerCase());
            if (caseTeamIndex >= 0) {
                return caseTeams[caseTeamIndex].fileName;
            } else {
                return caseName + '.caseteam';
            }
        }
        return '';
    }

}
