'use strict';


class CaseTypeEditor {
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
     * 
     * @param {(CaseFileItemDef) => void} callback 
     */
    openDialog(callback) {
        new ZoomTypeDialog(this).showModalDialog(cfi => cfi && callback(cfi));
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

    generateTypeSelectorHTML() {
        const html = $(`<div style="display:inline;position:absolute;right:9px;top:9px">
            <label>Type:</label>
            <select class="selectCaseFileModel"></select>
        </div>`);
        this.htmlContainer.append(html);
        this.typeSelector = new TypeSelector(this.typeEditor, html.find('.selectCaseFileModel'), this.typeRef, v => this.typeRef = v);
    }

    get typeRef() {
        return this.case.caseDefinition.caseFile.typeRef;
    }    

    /**
     * @param {String} typeRef
     */
    set typeRef(typeRef) {
        this.file =  /** @type {TypeFile} */ (this.ide.repository.get(typeRef));
        this.case.caseDefinition.caseFile.typeRef = typeRef;
        if (this.file) {
            this.typeEditor.setMainType(this.file);
        } else {
            Util.clearHTML(this.htmlContainer);
            this.typeEditor.generateHTML();
            this.generateTypeSelectorHTML();
        }
        this.case.editor.completeUserAction();
    }
}
