class CaseFileEditor {
    /**
     * Renders the CaseFile definition through fancytree
     * @param {CaseView} cs 
     * @param {JQuery<HTMLElement>} htmlParent 
     */
    constructor(cs, htmlParent) {
        this.case = cs;
        this.ide = this.case.editor.ide;
        this.htmlParent = htmlParent;
        this.html = htmlParent;
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

    getElement(path) {
        return this.typeEditor.typeEditor.getSchemaPropertyDefinitionWithPath(path);
    }

    showUsedIn() {
        if (this.usesOldEditor) {
            this.classicEditor.showUsedIn();
        }
    }

    /**
     * Opens the editor form.
     * @param {Function} callback 
     */
    open(callback = undefined) {
        if (this.usesOldEditor) {
            this.classicEditor.open(callback);
        }
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
