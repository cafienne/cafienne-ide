class ProcessFile extends ServerFileWithEditor {
    createEditor() {
        return new ProcessModelEditor(this);
    }

    createDefinition() {
        return new ProcessModelDefinition(this.content.xml);
    }

    /** @returns {ProcessModelDefinition} */
    get definition() {
        return /** @type {ProcessModelDefinition} */ (this.content.definition);
    }
}
