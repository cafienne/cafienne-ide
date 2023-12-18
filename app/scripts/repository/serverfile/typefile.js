class TypeFile extends ServerFileWithEditor {
    createEditor() {
        return new TypeModelEditor(this);
    }

    createDefinition() {
        return new TypeDefinition(this.content.xml);
    }

    /** @returns {TypeDefinition} */
    get definition() {
        return /** @type {TypeDefinition} */ (this.content.definition);
    }
}
