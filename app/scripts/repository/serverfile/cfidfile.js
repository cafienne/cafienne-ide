class CFIDFile extends ServerFile {
    createDefinition() {
        return new CaseFileDefinitionDefinition(this);
    }

    /** @returns {CaseFileDefinitionDefinition} */
    get definition() {
        return /** @type {CaseFileDefinitionDefinition} */ (this.content.definition);
    }
}
