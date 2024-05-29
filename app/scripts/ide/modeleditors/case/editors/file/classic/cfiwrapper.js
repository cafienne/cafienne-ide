class CFIWrapper {
    /**
     * 
     * @param {CFIDConverter} converter 
     * @param {CaseFileItemDef} cfi 
     * @param {CFIWrapper|undefined} parent 
     */
    constructor(converter, cfi, parent) {
        this.converter = converter;
        this.cfi = cfi;
        this.parent = parent;
        this.converter.cfiWrappers.push(this);
        this.load();
    }

    load() {
        this.loadUsage();
        this.loadCFID();
        this.resolveType();
        this.loadChildren();
    }

    loadUsage() {
        this.caseElementsUsingCFI = this.cfi.searchInboundReferences();
    }

    loadCFID() {
        if (! this.cfi.definitionRef) {
            throw new Error(`Cannot convert to type, because Case File Item ${this.cfi.name} has no CaseFileItemDefinition associated with it (property 'definitionRef' is missing or empty)`);
        }

        // Load children
        this.cfi.children.forEach(child => new CFIWrapper(this.converter, child, this));

        // resolve cfid
        this.cfidFile = this.converter.repository.getCaseFileItemDefinitions().find(file => file.fileName === this.cfi.definitionRef);

        if (! this.cfidFile) {
            throw new Error(`Cannot convert to type, because Case File Item ${this.cfi.name} refers to definition '${this.cfi.definitionRef}', but that file does not exist`)
        }
    }

    resolveType() {
        this.typeWrapper = TypeWrapper.getType(this.converter, this.cfidFile);
    }

    loadChildren() {
        this.cfi.children.forEach(child => new CFIWrapper(this.converter, child, this));
    }
}
