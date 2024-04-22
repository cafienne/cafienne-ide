class LocalTypeDefinition {
    /**
     * 
     * @param {TypeEditor} typeEditor 
     * @param {TypeFile} file 
     * @param {MainTypeDefinition} root 
     */
    constructor(typeEditor, file, root) {
        this.editor = typeEditor;
        this.file = file;
        this.root = root;
        this.definition = file.definition;
    }

    /**
     * 
     * @param {TypeRenderer} source 
     * @param {() => void} callback
     */
    save(source = undefined, callback = () => {}) {
        this.file.source = this.definition.toXML();
        TypeRenderer.refreshOthers(source);
        this.file.save(andThen(callback));
    }

    /**
     * 
     * @param {TypeFile} file 
     * @returns {LocalTypeDefinition}
     */
    registerLocalDefinition(file) {
        return this.root.registerLocalDefinition(file);
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
