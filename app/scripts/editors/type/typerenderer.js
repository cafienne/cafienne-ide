class TypeRenderer {
    /**
     * 
     * @param {TypeEditor|TypeRenderer} parent 
     * @param {LocalTypeDefinition} localType 
     * @param {SchemaPropertyDefinition|SchemaDefinition} definition 
     * @param {JQuery<HTMLElement>} htmlParent 
     */
    constructor(parent, localType, definition, htmlParent) {
        this.parent = parent instanceof TypeRenderer ? parent : undefined;
        this.editor = parent instanceof TypeEditor ? parent : parent.editor;
        this.ide = this.editor.ide;
        this.localType = localType;
        this.definition = definition;
        this.htmlParent = htmlParent;
    }

    /**
     * Returns true if the potential child has us as an ancestor;
     * @param {TypeRenderer} potentialChild 
     * @returns {Boolean}
     */
    hasDescendent(potentialChild) {
        if (potentialChild) {
            if (potentialChild.parent === this) return true;
            return this.hasDescendent(potentialChild.parent);
        } else {
            return false;
        }
    }

    /**
     * Returns true if the typeRef is available as type in this renderer.
     * @param {PropertyRenderer} source
     * @param {String} typeRef 
     */
    hasCycle(source, typeRef) {
        if (this.parent) {
            return this.parent.hasCycle(source, typeRef);
        } else {
            return undefined;
        }
    }

    get propertyName() {
        if (this.definition instanceof SchemaPropertyDefinition) {
            return this.definition.name;
        } else {
            return this.parent ? this.parent.propertyName : '';
        }        
    }

    get name() {
        if (this.definition instanceof SchemaPropertyDefinition) {
            return this.definition.name;
        } else {
            return '';
        }
    }

    get path() {
        const parentPaths = [];
        let ancestor = this.parent;
        while (ancestor) {
            parentPaths.push(ancestor.name);
            ancestor = ancestor.parent;
        }
        const parent = parentPaths.filter(p => p !== '').reverse().join('/');
        return parent.length > 0 ? parent + '/' + this.name : this.name;
    }
}
