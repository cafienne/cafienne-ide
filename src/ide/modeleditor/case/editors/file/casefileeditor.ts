import $ from "jquery";
import CaseTypeEditor from "./casetypeeditor";
import CaseFileItemsEditor from "./classic/casefileitemseditor";
import CaseView from "../../elements/caseview";
import CFISelector from "./cfiselector";
import CaseFileItemDragData from "@ide/dragdrop/casefileitemdragdata";
import IDE from "@ide/ide";
import CaseFileItemDef from "@repository/definition/cmmn/casefile/casefileitemdef";

export default class CaseFileEditor {
    case: CaseView;
    ide: IDE;
    html: JQuery<HTMLElement>;
    divClassicEditor: JQuery<HTMLElement>;
    divCaseTypeEditor: JQuery<HTMLElement>;
    typeEditor: CaseTypeEditor;
    classicEditor?: CaseFileItemsEditor;
    dragData?: CaseFileItemDragData;
    /**
     * Renders the CaseFile definition through fancytree
     * @param {CaseView} cs 
     * @param {JQuery<HTMLElement>} htmlParent 
     */
    constructor(cs: CaseView, public htmlParent: JQuery<HTMLElement>) {
        this.case = cs;
        this.ide = this.case.editor.ide;
        this.html = $(`
            <div class="divCaseFileEditor">
                <div class="divClassicCaseFileEditor"></div>
                <div class="divCaseTypeEditor"></div>
            </div>`);
        this.htmlParent.append(this.html);
        this.divClassicEditor = this.html.find('.divClassicCaseFileEditor');
        this.divCaseTypeEditor = this.html.find('.divCaseTypeEditor');

        this.typeEditor = new CaseTypeEditor(this, this.divCaseTypeEditor);

        if (this.usesOldEditor) {
            this.classicEditor = new CaseFileItemsEditor(this, this.divClassicEditor);
            // For compatibility show old model with CFI / CFID struncture in caseFileModel
            this.divClassicEditor.show();
            this.divCaseTypeEditor.hide();
        } else {
            // Show new type model editor
            this.divClassicEditor.hide();
            this.divCaseTypeEditor.show();
        }
    }

    get usesOldEditor() {
        return this.case.caseDefinition.caseFile.isOldStyle;
    }

    showUsedIn() {
        if (this.classicEditor) {
            this.classicEditor.showUsedIn();
        }
    }

    /**
     */
    open(callback = (cfi: CaseFileItemDef) => { }) {
        new CFISelector(this.case).showModalDialog((cfi: CaseFileItemDef) => cfi && callback(cfi));
    }

    delete() {
        if (this.classicEditor) {
            this.classicEditor.delete();
        }
        this.typeEditor.delete();
    }

    validate() {
        if (this.classicEditor) {
            this.classicEditor.validate();
        }
    }

    /**
     * Registers a function handler that is invoked upon dropping an element.
     * If an item from the editor is moved over the canvas, elements and form properties can register themselves as a drop handler
     * @param {(dragData: CaseFileItemDragData) => void} dropHandler
     */
    setDropHandler(dropHandler: (dragData: CaseFileItemDragData) => void) {
        if (this.dragData) this.dragData.setDropHandler(dropHandler);
    }

    /**
     * Removes the active drop handler and filter
     */
    removeDropHandler() {
        if (this.dragData) this.dragData.removeDropHandler();
    }

    /**
     * 
     */
    startDragging(cfi: CaseFileItemDef) {
        this.dragData = new CaseFileItemDragData(this, cfi);
    }
}