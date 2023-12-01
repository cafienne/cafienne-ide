class CFIDFile extends ServerFileWithEditor {
    createEditor() {
        return new CFIDModelEditor(this);
    }

    createDefinition() {
        return new CaseFileDefinitionDefinition(this.content.xml);
    }

    /** @returns {CaseFileDefinitionDefinition} */
    get definition() {
        return /** @type {CaseFileDefinitionDefinition} */ (this.content.definition);
    }
}
