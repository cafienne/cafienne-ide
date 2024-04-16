import TypeEditor from "@ide/modeleditor/type/editor/typeeditor";
import TypeSelector from "@ide/modeleditor/type/editor/typeselector";
import TypeFile from "@repository/serverfile/typefile";
import { andThen } from "@util/promise/followup";
import Util from "@util/util";
import $ from "jquery";
import CaseFileEditor from "./casefileeditor";

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
        this.typeSelector = new TypeSelector(this.typeEditor.ide.repository, this.htmlContainer.find('.selectCaseFileModel'), this.typeRef, v => this.typeRef = v);
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
        this.divTypeEditor = this.htmlContainer.find('.type-editor-box');
    }

    /**
     * Deletes this editor
     */
    delete() {
        this.typeEditor.delete();
        if (this.typeSelector) {
            this.typeSelector.delete();
        }
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
                Util.clearHTML(this.divTypeEditor);
                this.typeEditor.generateHTML();
            }
            this.case.editor.completeUserAction();
        }));
    }
}
