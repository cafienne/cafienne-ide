class CaseFileItemDefinition extends ModelDefinition {
    /**
     * Imports an XML element and parses it into a in-memory definition structure.
     * @param {Element} importNode 
     */
    constructor(importNode) {
        super(importNode);
    }
    
    parseDocument() {
        super.parseDocument();
        this.implementation = new CaseFileItemDef(this.importNode, this, this);
    }

    get id() {
        return this.implementation.id;
    }

    set id(id) {
        if (this.implementation) this.implementation.id = id;
    }
    
    get name() {
        return this.implementation.name;
    }

    set name(name) {
        if (this.implementation) this.implementation.name = name;
    }

    toXML() {
        const xmlDocument = super.exportModel('caseFileItem');
        this.implementation.exportNode = xmlDocument.documentElement;
        this.implementation.exportProperties('definitionRef');
        this.implementation.exportChildren();
        return xmlDocument;
    }
}
