import SchemaPropertyDefinition from "@repository/definition/type/schemapropertydefinition";
import LocalTypeDefinition from "./localtypedefinition";
import TypeEditor from "./typeeditor";
import SchemaDefinition from "@repository/definition/type/schemadefinition";
import PropertyRenderer from "./propertyrenderer";

export default class TypeRenderer {

    /**
     * All current in-memory renderers, used for refreshing
     * @type {Array<TypeRenderer>}
     */
    static renderers = [];

    /**
     * Register a new renderer. Includes code smell check when a similar renderer is already registered in the same editor with the same path.
     * @param {TypeRenderer} renderer 
     */
    static register(renderer) {
        const similar = other => {
            if (!other) return false;
            if (renderer === other) return true;
            if (renderer.constructor.name !== other.constructor.name) return false;
            if (renderer.editor !== other.editor) return false;
            if (renderer.localType !== other.localType) return false;
            return renderer.path === other.path;    
        }

        if (this.renderers.find(similar)) {
            console.warn('Cannot add renderer again found ' + renderer.constructor.name + ' ' + renderer)
            return;
        }
        this.renderers.push(renderer);
    }

    /**
     * Remove a renderer from the cache.
     * @param {TypeRenderer} renderer 
     */
    static remove(renderer) {
        // console.log('Removing ' + renderer);
        Util.removeFromArray(this.renderers, renderer);
    }

    /**
     * 
     * @param {TypeRenderer} source 
     */
    static refreshOthers(source) {
        // Editor filter finds all other editors that render the same type definition as the source does. If source is not present, all editors are refreshed.
        const editorFilter = renderer => source === undefined || renderer.editor !== source.editor && renderer.localType.sameFile(source.localType);

        const otherEditors = this.renderers.filter(editorFilter).map(r => r.editor).filter((value, index, self) => index === self.findIndex((t) => t === value));
        otherEditors.forEach(editor => editor.refresh());

        if (source) {
            // If we have a source renderer, we should only refresh the other renderers on the same definition.
            const otherRenderersOnThisType = this.renderers.filter(other => other.editor === source.editor && other !== source && other.definition === source.definition);
            // We refresh the parent, because the refresh logic appends it's own property again, instead of re-using the property container inside the parent.
            otherRenderersOnThisType.forEach(r => r.refresh());    
        }
    }

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
        /** @type {Array<TypeRenderer>} */
        this.children = [];
        if (this.parent) {
            this.parent.children.push(this);
        }
        TypeRenderer.register(this);
    }

    delete() {
        this.orphan = true;
        this.children.forEach(child => child.delete());
        this.children = [];
        TypeRenderer.remove(this);
        this.parent = undefined;
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

    hasAncestor(potentialAncestor) {
        if (potentialAncestor) {
            if (this.parent) {
                if (this.parent === potentialAncestor) return true;
                return this.parent.hasAncestor(potentialAncestor);
            }
        }
            return false;
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

    refresh() {
        throw new Error('This method must be implemented in ' + this.constructor.name);
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

    get prefix() {
        return this.editor.case ? 'Case ' + this.editor.case.editor.fileName : 'Type editor of ' + this.editor.mainType.file.fileName;;
    }

    toString() {
        return `${this.path} in ${this.prefix} on main type ${this.localType.file.fileName}`
    }
}
