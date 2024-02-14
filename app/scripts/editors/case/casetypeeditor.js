'use strict';

class CaseTypeEditor {
    /**
     * Renders the caseFileModel definition
     * @param {CaseView} cs 
     * @param {JQuery<HTMLElement>} htmlParent 
     */

    constructor(cs, htmlParent) {
        this.case = cs;
        this.ide = this.case.editor.ide;
        this.htmlContainer = htmlParent;
        this.file =  /** @type {TypeFile} */ (this.ide.repository.get(this.case.caseDefinition.caseFile.typeRef));
        this.typeEditor = new TypeEditor(this.ide, this.file, this.htmlContainer);
        if (this.file) {
            this.typeEditor.loadModel();
        }
        this.generateTypeSelectorHTML();
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
                this.typeEditor.file = this.file;
                this.typeEditor.loadModel();
            } else {
                Util.clearHTML(this.htmlContainer);
                this.typeEditor.generateHTML();
                this.generateTypeSelectorHTML();
            }
            this.case.editor.completeUserAction();
        });
    }
}
