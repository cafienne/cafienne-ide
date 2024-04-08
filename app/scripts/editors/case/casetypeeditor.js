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
        this.htmlContainer = htmlParent;
        this.file =  /** @type {TypeFile} */ (this.ide.repository.get(this.case.caseDefinition.caseFile.typeRef));
        this.typeEditor = new TypeEditor(this, this.htmlContainer, this.case);
        this.generateTypeSelectorHTML();
        if (this.file) {
            this.typeEditor.setMainType(this.file);
        }
    }

    /**
     * Deletes this editor
     */
    delete() {
        this.typeEditor.delete();
        Util.removeHTML(this.htmlContainer);
    }

    generateTypeSelectorHTML() {
        const html = $(`<div style="display:inline;position:absolute;right:9px;top:9px">
            <label>Type:</label>
            <select class="selectCaseFileModel">${this.typeEditor.getOptionTypeHTML()}</select>
        </div>`);
        this.htmlContainer.append(html);
        html.find('.selectCaseFileModel').val(this.case.caseDefinition.caseFile.typeRef);
        html.find('.selectCaseFileModel').on('change', e => {
            const typeRef = e.currentTarget.value;
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
        });
    }
}
