class TypeFile extends ServerFileWithEditor {
    createEditor() {
        return new TypeModelEditor(this);
    }

    createDefinition() {
        return new TypeDefinition(this);
    }

    /** @returns {TypeDefinition} */
    get definition() {
        return /** @type {TypeDefinition} */ (this.content.definition);
    }
}
