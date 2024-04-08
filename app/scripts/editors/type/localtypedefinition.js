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
    }

    /**
     * 
     * @param {TypeRenderer} source 
     */
    save(source = undefined) {
        this.file.source = this.definition.toXML();
        this.file.save();
        TypeRenderer.refreshOthers(source);
    }

    /**
     * 
     * @param {LocalTypeDefinition} other 
     * @returns 
     */
    sameFile(other) {
        return other && this.file.fileName === other.file.fileName;
    }
}
