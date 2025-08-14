import $ from "jquery";
import IDE from "../../../../ide";
import TypeEditor from "../../../../modeleditor/type/editor/typeeditor";
import TypeSelector from "../../../../modeleditor/type/editor/typeselector";
import HtmlUtil from "../../../../util/htmlutil";
import CaseCanvas from "../../elements/casecanvas";
import CaseFileEditor from "./casefileeditor";

export default class CaseTypeEditor {
    case: CaseCanvas;
    ide: IDE;
    typeEditor: TypeEditor;
    divTypeEditor!: JQuery<HTMLDivElement>;
    htmlContainer: JQuery<HTMLElement>;
    typeSelector: TypeSelector;
    caseTypeSelector: JQuery<HTMLElement>;
    /**
     * Renders the caseFileModel definition
     */
    constructor(public caseFileEditor: CaseFileEditor, public htmlParent: JQuery<HTMLElement>) {
        this.case = caseFileEditor.case;
        this.ide = this.case.editor.ide;
        this.htmlContainer = this.generateHTML();
        this.typeEditor = new TypeEditor(this, this.divTypeEditor, this.case);
        this.caseTypeSelector = this.generateCaseTypeSelectorHTML();
        this.typeSelector = new TypeSelector(this.typeEditor.ide.repository, this.htmlContainer.find('.selectCaseFileModel'), this.typeRef, (v: string) => this.typeRef = v);
        this.typeEditor.loadMainType(this.typeRef)
    }

    generateHTML() {
        this.htmlContainer = $(
            `<div class="casetype-editor">
                <div class="casetype-header">
                    <label>Case File</label>
                </div>
                <div class="type-editor-box"></div>
            </div>`
        );
        this.htmlParent.append(this.htmlContainer);
        this.divTypeEditor = this.htmlContainer.find('.type-editor-box');
        return this.htmlContainer;
    }

    generateCaseTypeSelectorHTML() {
        this.caseTypeSelector = $(
            `<div class="casetype-selector">
                <label>Case File Type</label>
                <select class="selectCaseFileModel"></select>
            </div>`
        );
        this.htmlContainer?.find('#typeeditorcontent').append(this.caseTypeSelector);
        return this.caseTypeSelector;
    }

    /**
     * Deletes this editor
     */
    delete() {
        this.typeEditor.delete();
        HtmlUtil.clearHTML(this.htmlContainer);
    }

    get typeRef() {
        return this.case.caseDefinition.caseFile.typeRef;
    }

    set typeRef(typeRef: string) {
        this.case.caseDefinition.caseFile.typeRef = typeRef;
        this.typeEditor.loadMainType(typeRef);
        this.case.editor.completeUserAction();
    }
}
