import CaseTypeEditor from "./casetypeeditor";
import CaseFileItemsEditor from "./classic/casefileitemseditor";

export default class CaseFileEditor {
    /**
     * Renders the CaseFile definition through fancytree
     * @param {CaseView} cs 
     * @param {JQuery<HTMLElement>} htmlParent 
     */
    constructor(cs, htmlParent) {
        this.case = cs;
        this.ide = this.case.editor.ide;
        this.htmlParent = htmlParent;
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
        if (this.usesOldEditor) {
            this.classicEditor.showUsedIn();
        }
    }

    /**
     * @param {(CaseFileItemDef) => void} callback 
     */
    open(callback = undefined) {
        new CFISelector(this.case).showModalDialog(cfi => cfi && callback(cfi));
    }

    delete() {
        if (this.usesOldEditor) {
            this.classicEditor.delete();
        }
        this.typeEditor.delete();
    }

    validate() {
        if (this.usesOldEditor) {
            this.classicEditor.validate();
        }
    }

    /**
     * Registers a function handler that is invoked upon dropping an element.
     * If an item from the editor is moved over the canvas, elements and form properties can register themselves as a drop handler
     * @param {Function} dropHandler
     * @param {Function} filter
     */
    setDropHandler(dropHandler, filter = undefined) {
        if (this.dragData) this.dragData.setDropHandler(dropHandler, filter);
    }

    /**
     * Removes the active drop handler and filter
     */
    removeDropHandler() {
        if (this.dragData) this.dragData.removeDropHandler();
    }

    /**
     * 
     * @param {CaseFileItemDragData} dragData 
     */
    setDragData(dragData) {
        this.dragData = dragData;
    }
}
