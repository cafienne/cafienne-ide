import TypeFile from "@repository/serverfile/typefile";
import CaseFileEditor from "./casefileeditor";
import TypeEditor from "@ide/modeleditor/type/editor/typeeditor";
import Util from "@util/util";

export default class CaseTypeEditor {
    /**
     * Renders the caseFileModel definition
     * @param {CaseFileEditor} caseFileEditor 
     * @param {JQuery<HTMLElement>} htmlParent 
     */
    constructor(caseFileEditor, htmlParent) {
        this.caseFileEditor = caseFileEditor;
        this.case = caseFileEditor.case;
        this.ide = this.case.editor.ide;
        this.htmlParent = htmlParent;
        this.generateHTML();
        this.file =  /** @type {TypeFile} */ (this.ide.repository.get(this.case.caseDefinition.caseFile.typeRef));
        this.typeEditor = new TypeEditor(this, this.divTypeEditor, this.case);
        this.htmlContainer.find('.selectCaseFileModel').html(this.typeEditor.getOptionTypeHTML());
        this.htmlContainer.find('.selectCaseFileModel').val(this.typeRef);
        if (this.file) {
            this.typeEditor.setMainType(this.file);
        }
    }

    generateHTML() {
        this.htmlContainer = $(
            `<div class='casetype-editor'>
                <div class='casetype-editor-header' style="z-index:1000;position:absolute;right:9px;top:9px">
                    <label>Type:</label>
                    <select class="selectCaseFileModel"></select>
                </div>
                <div class='type-editor-box'></div>
            </div>`);
        this.htmlParent.append(this.htmlContainer);
        this.htmlContainer.find('.selectCaseFileModel').on('change', e => this.typeRef = e.currentTarget.value);
        this.divTypeEditor = this.htmlContainer.find('.type-editor-box');
    }

    /**
     * Deletes this editor
     */
    delete() {
        this.typeEditor.delete();
        Util.removeHTML(this.htmlContainer);
    }

    get typeRef() {
        return this.case.caseDefinition.caseFile.typeRef;
    }

    /**
     * @param {String} typeRef
     */
    set typeRef(typeRef) {
        this.ide.repository.load(typeRef, andThen(file => {
            this.file =  /** @type {TypeFile} */ (file);
            this.case.caseDefinition.caseFile.typeRef = typeRef;
            if (this.file) {
                this.typeEditor.setMainType(this.file);
            } else {
                Util.clearHTML(this.htmlContainer);
                this.typeEditor.generateHTML();
                this.generateHTML();
            }
            this.case.editor.completeUserAction();
        }));
    }
}
