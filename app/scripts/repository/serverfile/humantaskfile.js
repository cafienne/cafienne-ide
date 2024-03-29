class HumanTaskFile extends ServerFileWithEditor {
    createEditor() {
        return new HumantaskModelEditor(this);
    }

    createDefinition() {
        return new HumanTaskModelDefinition(this.content.xml);
    }

    /** @returns {HumanTaskModelDefinition} */
    get definition() {
        return /** @type {HumanTaskModelDefinition} */ (this.content.definition);
    }
}
