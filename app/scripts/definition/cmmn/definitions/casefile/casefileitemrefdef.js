class CaseFileItemRefDef extends CaseFileItemDef {

    /**
     * 
     * @param {CaseDefinition} parent 
     * @param {String} id
     */
    static createEmptyDefinition(parent, id = undefined, name = '') {
        const definition = parent.createDefinition(CaseFileItemRefDef, id, name);
        definition.isEmpty = true;        
        return definition;
    }

    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
        this.multiplicity = this.parseAttribute('multiplicity', 'Unspecified');
        this.cfiRef = this.parseAttribute('cfiRef');
        this.caseFileItemModel = null;
        this.isEmpty = false;
    }

    createChildDefinition() {
        if (!this.caseFileItemModel && this.cfiRef) {
            console.log("createChildDefinition: CaseFileItemRefDef MO MODEL LOADED -> this.id / this.cfiRef: " + this.id + "/" + this.cfiRef);
        }
        return this.caseFileItemModel ? this.caseFileItemModel.implementation.createChildDefinition(): null;
    }

    /**
     * Returns all descending case file items including this one, recursively.
     */
    getDescendants() {
        if (!this.caseFileItemModel && this.cfiRef) {
            console.log("getDescendants: CaseFileItemRefDef MO MODEL LOADED -> this.id / this.cfiRef: " + this.id + "/" + this.cfiRef);
        }
        return this.caseFileItemModel ? this.caseFileItemModel.implementation.getDescendants() : [this];
    }

    get children() {
        if (!this.caseFileItemModel && this.cfiRef) {
            console.log("get children: CaseFileItemRefDef MO MODEL LOADED -> this.id / this.cfiRef: " + this.id + "/" + this.cfiRef);
        }
        return this.caseFileItemModel ? this.caseFileItemModel.implementation.children : [];
    }

    get cfiRef() {
        return this._cfiRef;
    }

    set cfiRef(value) {
        this._cfiRef = value;
    }

    get definitionRef() {
        return this.caseFileItemModel ? this.caseFileItemModel.implementation.definitionRef : '';
    }

    set definitionRef(value) {
        if (this.caseFileItemModel) this.caseFileItemModel.implementation.definitionRef = value;
    }

    createExportNode(parentNode) {
        if (this.isEmpty) return;

        super.createExportNode(parentNode, 'caseFileItemRef', 'cfiRef');
        this.exportNode.removeAttribute('definitionRef');
        const childrenNode = XML.getChildByTagName(this.exportNode, 'children');
        if (childrenNode) {
            //children should not be exported for caseFileItemRef but will be exported by refered caseFileItem
            this.exportNode.removeChild(childrenNode);
        }
    }
}
