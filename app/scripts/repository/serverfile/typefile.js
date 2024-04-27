class TypeFile extends ServerFile {
    createDefinition() {
        return new TypeDefinition(this);
    }

    /** @returns {TypeDefinition} */
    get definition() {
        return /** @type {TypeDefinition} */ (this.content.definition);
    }
}
