class CFIFile extends ServerFileWithEditor {
    createEditor() {
        return new CFIModelEditor(this);
    }

    createDefinition() {
        return new CaseFileItemDefinition(this.content.xml);
    }

    /** @returns {CaseFileItemDefinition} */
    get definition() {
        return /** @type {CaseFileItemDefinition} */ (this.content.definition);
    }
}
