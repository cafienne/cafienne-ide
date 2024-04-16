import IDE from "@ide/ide";
import TypeDefinition from "@repository/definition/type/typedefinition";
﻿import TypeEditor from "@ide/modeleditor/type/editor/typeeditor";
import TypeSelector from "@ide/modeleditor/type/editor/typeselector";
import TypeFile from "@repository/serverfile/typefile";
import Util from "@util/util";
import $ from "jquery";
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
    /**
     * Renders the caseFileModel definition
     * @param {CaseFileEditor} caseFileEditor 
     * @param {JQuery<HTMLElement>} htmlParent 
     */
    constructor(public caseFileEditor: CaseFileEditor, public htmlParent: JQuery<HTMLElement>) {
        this.case = caseFileEditor.case;
        this.ide = this.case.editor.ide;
        this.htmlContainer = this.generateHTML();
        this.file = <TypeFile>this.ide.repository.get(this.case.caseDefinition.caseFile.typeRef);
        this.typeEditor = new TypeEditor(this, this.divTypeEditor, this.case);
        this.typeSelector = new TypeSelector(this.typeEditor.ide.repository, this.htmlContainer.find('.selectCaseFileModel'), this.typeRef, (v: string) => this.typeRef = v);
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
        return this.htmlContainer;
    }

    /**
     * Deletes this editor
     */
    delete() {
        this.typeEditor.delete();
        if (this.typeSelector) {
            this.typeSelector.delete();
        }
        if (this.htmlContainer) Util.clearHTML(this.htmlContainer);
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
