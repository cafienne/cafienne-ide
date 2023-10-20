class CFIFile extends ServerFile {
    createDefinition() {
        return new CaseFileItemDefinition(this.content.xml);
    }

    /** @returns {CaseFileItemDefinition} */
    get definition() {
        return /** @type {CaseFileItemDefinition} */ (this.content.definition);
    }
}
