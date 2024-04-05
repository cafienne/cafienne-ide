
class LocalTypeDefinition {
    /**
     * 
     * @param {TypeEditor} typeEditor 
     * @param {TypeFile} file 
     */
    constructor(typeEditor, file) {
        this.editor = typeEditor;
        this.file = file;
        this.definition = file.definition;
        /** @type {Array<TypeRenderer>} */
        this.renderers = [];
    }

    save() {
        this.file.source = this.definition.toXML();
        this.file.save();
        // this.editor.containers.filter(container => container.file === this && container instanceof SchemaContainer).forEach(container => container.refresh())
    }

    addRenderer(renderer) {
        this.renderers.push(renderer);
    }

    /**
     * 
     * @param {TypeRenderer} renderer 
     */
    savePropertyChange(renderer) {
        this.file.source = this.definition.toXML();
        this.file.save();
    }
}
