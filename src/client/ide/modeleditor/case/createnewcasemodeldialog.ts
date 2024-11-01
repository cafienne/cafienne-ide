import CreateNewModelDialog from "@ide/createnewmodeldialog";
import IDE from "@ide/ide";
import $ from "jquery";
import TypeSelector, { Option } from "../type/editor/typeselector";

export default class CreateNewCaseModelDialog extends CreateNewModelDialog {
    typeRef: string = '';
    typeSelector?: TypeSelector;
    /**
     * @param {IDE} ide
     * @param {string} label
     */
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
        });
        dialogHTML.find('.buttonOk').on('click', e => this.closeModalDialog(this.createResult(dialogHTML)));
        dialogHTML.find('.buttonCancel').on('click', e => this.closeModalDialog(false));
        this.typeSelector = new TypeSelector(this.ide.repository, dialogHTML.find('.selectType'), this.typeRef, (v: string) => this.typeRef = v, false);
    }

    createResult(dialogHTML: JQuery<HTMLElement>) {
        const result = super.readResult(dialogHTML);
        (result as any).typeRef = this.typeRef;
        return result;
    }

    /**
     * Create an additional <new> option when typeRef doesn't already exists
     * @returns {Array<string>}
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
     * Returns a case sensitive typeRef when found in repository or construct a new typeRef
     * @param {string} caseName 
     * @returns {string}
     */
    deriveTypeRefFromCaseName(caseName: string) {
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
}
