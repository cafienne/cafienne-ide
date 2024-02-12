'use strict';

class CaseTypeEditor extends TypeEditor {
    /**
     * Renders the caseFileModel definition
     * @param {Case} cs 
     * @param {JQuery<HTMLElement>} htmlParent 
     */

    constructor(cs, htmlParent) {
        super(cs.editor.ide, null, htmlParent);
        this.case = cs;
        this.file =  /** @type {TypeFile} */ (this.ide.repository.get(this.case.caseDefinition.caseFile.typeRef));
        if (this.file) {
            this.loadModel();
        }
        this.generateTypeSelectorHTML();
    }

    generateTypeSelectorHTML() {
        const html = $(`<div style="display:inine;position:absolute;right:9px;top:9px"><label>Type: <select class="selectCaseFileModel">${this.getOptionTypeHTML()}</select></div>`);
        this.htmlContainer.append(html);
        html.find('.selectCaseFileModel').val(this.case.caseDefinition.caseFile.typeRef);
        html.find('.selectCaseFileModel').on('change', e => {
            const typeRef = e.currentTarget.value;
            this.file =  /** @type {TypeFile} */ (this.ide.repository.get(typeRef));
            this.case.caseDefinition.caseFile.typeRef = typeRef;
            if (this.file) {
                this.loadModel();
            } else {
                Util.clearHTML(this.htmlContainer);
                this.generateHTML();
                this.generateTypeSelectorHTML();
            }
            this.case.editor.completeUserAction();
        });
    }
}
