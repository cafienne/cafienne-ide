﻿import $ from "jquery";
import TypeDefinition from "../../../../../repository/definition/type/typedefinition";
import TypeFile from "../../../../../repository/serverfile/typefile";
import IDE from "../../../../ide";
import TypeEditor from "../../../../modeleditor/type/editor/typeeditor";
import TypeSelector from "../../../../modeleditor/type/editor/typeselector";
import HtmlUtil from "../../../../util/htmlutil";
import CaseView from "../../elements/caseview";
import CaseFileEditor from "./casefileeditor";

export default class CaseTypeEditor {
    case: CaseView;
    ide: IDE;
    file: TypeFile;
    typeEditor: TypeEditor;
    divTypeEditor: any;
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
        this.file = <TypeFile>this.ide.repository.get(this.case.caseDefinition.caseFile.typeRef);
        this.typeEditor = new TypeEditor(this, this.divTypeEditor, this.case);
        this.caseTypeSelector = this.generateCaseTypeSelectorHTML();
        this.typeSelector = new TypeSelector(this.typeEditor.ide.repository, this.htmlContainer.find('.selectCaseFileModel'), this.typeRef, (v: string) => this.typeRef = v);
        if (this.file) {
            this.typeEditor.setMainType(this.file);
        }
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
        if (this.typeSelector) {
            this.typeSelector.delete();
        }
        if (this.htmlContainer) HtmlUtil.clearHTML(this.htmlContainer);
    }

    get typeRef() {
        return this.case.caseDefinition.caseFile.typeRef;
    }

    set typeRef(typeRef: string) {
        if (!typeRef) {
            this.typeEditor.setMainType();
            this.case.editor.completeUserAction();
        } else {
            this.ide.repository.load<TypeDefinition>(typeRef).then(file => {
                this.file = file;
                this.case.caseDefinition.caseFile.typeRef = typeRef;
                this.typeEditor.setMainType(this.file);
                this.case.editor.completeUserAction();
            });
        }
    }
}
