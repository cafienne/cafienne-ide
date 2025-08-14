import SchemaPropertyDefinition from "../../../../repository/definition/type/schemapropertydefinition";
import TypeDefinitionElement from "../../../../repository/definition/type/typedefinitionelement";
import Util from "../../../../util/util";
import LocalTypeDefinition from "./localtypedefinition";
import PropertyRenderer from "./propertyrenderer";
import TypeEditor from "./typeeditor";

export default abstract class TypeRenderer<D extends TypeDefinitionElement> {

    /**
     * All current in-memory renderers, used for refreshing
     */
    static renderers: TypeRenderer<TypeDefinitionElement>[] = [];
    children: TypeRenderer<TypeDefinitionElement>[];
    orphan: boolean = false;

    /**
     * Register a new renderer. Includes code smell check when a similar renderer is already registered in the same editor with the same path.
     */
    static register(renderer: TypeRenderer<TypeDefinitionElement>) {
        const similar = (other?: TypeRenderer<TypeDefinitionElement>) => {
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
     */
    static remove(renderer: TypeRenderer<TypeDefinitionElement>) {
        // console.log('Removing ' + renderer);
        Util.removeFromArray(this.renderers, renderer);
    }

    static refreshOthers(source?: TypeRenderer<TypeDefinitionElement>) {
        // Editor filter finds all other editors that render the same type definition as the source does. If source is not present, all editors are refreshed.
        const editorFilter = (renderer: TypeRenderer<TypeDefinitionElement>) => source === undefined || renderer.editor !== source.editor && renderer.localType.sameFile(source.localType);

        const otherEditors = this.renderers.filter(editorFilter).map(r => r.editor).filter((value, index, self) => index === self.findIndex((t) => t === value));
        otherEditors.forEach(editor => editor.refresh());

        if (source) {
            // If we have a source renderer, we should only refresh the other renderers on the same definition.
            const otherRenderersOnThisType = this.renderers.filter(other => other.editor === source.editor && other !== source && other.definition === source.definition);
            // We refresh the parent, because the refresh logic appends it's own property again, instead of re-using the property container inside the parent.
            otherRenderersOnThisType.forEach(r => r.refresh());
        }
    }

    constructor(public editor: TypeEditor, public parent: TypeRenderer<TypeDefinitionElement> | undefined, public localType: LocalTypeDefinition, public definition: D, public htmlParent: JQuery<HTMLElement>) {
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

    getDescendents(): TypeRenderer<TypeDefinitionElement>[] {
        return [this, ...this.children.map(child => child.getDescendents()).flat()];
    }

    /**
     * Returns true if the potential child has us as an ancestor;
     */
    hasDescendent(potentialChild?: TypeRenderer<TypeDefinitionElement>): boolean {
        if (potentialChild) {
            if (potentialChild.parent === this) return true;
            return this.hasDescendent(potentialChild.parent);
        } else {
            return false;
        }
    }

    hasAncestor(potentialAncestor?: TypeRenderer<TypeDefinitionElement>): boolean {
        if (potentialAncestor) {
            if (this.parent) {
                if (this.parent === potentialAncestor) return true;
                return this.parent.hasAncestor(potentialAncestor);
            }
        }
        return false;
    }

    /**
     * Returns a string with the description if the typeRef is available as type in this renderer.
     * Else returns an empty string.
     */
    hasCycle(source: PropertyRenderer, typeRef: string): string {
        if (this.parent) {
            return this.parent.hasCycle(source, typeRef);
        } else {
            return '';
        }
    }

    abstract refresh(): void;

    get propertyName(): string {
        if (this.definition instanceof SchemaPropertyDefinition) {
            return this.definition.name;
        } else {
            return this.parent ? this.parent.propertyName : '';
        }
    }

    get name(): string {
        if (this.definition instanceof SchemaPropertyDefinition) {
            return this.definition.name;
        } else {
            return '';
        }
    }

    get path(): string {
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
        return this.editor.canvas ? 'Case ' + this.editor.canvas.editor.fileName : 'Type editor of ' + this.editor.mainType?.file.fileName;;
    }

    toString() {
        return `${this.path} in ${this.prefix} on main type ${this.localType.file.fileName}`
    }
}
