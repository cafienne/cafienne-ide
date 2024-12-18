import ServerFile from "@repository/serverfile/serverfile";
import ModelDefinition from "./modeldefinition";
import InternalReference from "./references/internalreference";
import { InternalReferenceList } from "./references/referencelist";
import { ReferenceSet } from "./references/referenceset";
import XMLSerializable from "./xmlserializable";

export default class ElementDefinition<M extends ModelDefinition> extends XMLSerializable {
    readonly internalReferences = new InternalReferenceList(this);
    childDefinitions: ElementDefinition<M>[] = [];

    /**
     * Creates a new ElementDefinition that belongs to the Definition object.
     */
    constructor(importNode: Element, public modelDefinition: M, public parent?: ElementDefinition<M>) {
        super(importNode);
        this.modelDefinition.addElement(this);
        if (parent && parent instanceof ElementDefinition) {
            this.parent = parent;
            this.parent.childDefinitions.push(this);
        }
    }

    parseInternalReference<I extends InternalReference<ElementDefinition<M>>>(name: string, constructor?: new (element: XMLSerializable, ref: string) => I): I {
        return this.internalReferences.add(this.parseAttribute(name), constructor);
    }

    parseReferenceSet<I extends InternalReference<ElementDefinition<M>>>(name: string, constructor?: new (element: XMLSerializable, ref: string) => I): ReferenceSet<I> {
        return new ReferenceSet<I>(this, this.parseAttribute(name), constructor);
    }

    resolveReferences() {
        super.resolveReferences();
        this.internalReferences.resolve();
    }

    /**
     * Returns true if name or id property equals the identifier
     */
    hasIdentifier(identifier: string) {
        return this.id === identifier || this.name === identifier;
    }

    getIdentifier() {
        return this.id ? this.id : this.name ? this.name : '';
    }

    /**
     * Creates a new instance of the constructor with an optional id and name
     * attribute. If these are not given, the logic will generate id and name for it based
     * on the type of element and the other content inside the model definition.
     * @returns an instance of the constructor that is expected to extend CMMNElementDefinition
     */
    createDefinition<T extends ElementDefinition<M>>(constructor: Function, id?: string, name?: string): T {
        return this.modelDefinition.createDefinition(constructor, this, id, name);
    }

    isNamedElement() {
        return true;
    }

    private removeChildDefinitions() {
        // First, delete our children in the reverse order that they were created.
        this.childDefinitions.slice().reverse().forEach(child => {
            console.groupCollapsed(`Removing ${child} ${child.childDefinitions.length ? 'and ' + child.childDefinitions.length + ' children' : ''}`)
            child.removeChildDefinitions();
            console.groupEnd();
        });
        console.groupCollapsed(`Clean up references to ${this} inside other elements of ${this.modelDefinition.file.fileName}`);
        // Next, inform the whole model definition about it.
        this.modelDefinition.removeDefinitionElementReferences(this);
        // Finally remove all our properties.
        for (const key in this) delete this[key];
        console.groupEnd();
    }

    removeDefinition() {
        console.groupCollapsed(`Removing ${this} ${this.childDefinitions.length ? 'and ' + this.childDefinitions.length + ' children' : ''}`)
        this.removeChildDefinitions();
        console.groupEnd();
    }

    loadFile<M extends ModelDefinition>(fileName: string): ServerFile<M> | undefined {
        return this.modelDefinition.loadFile(fileName);
    }

    /**
     * Returns all elements that have a reference to this element
     */
    searchInboundReferences(): ElementDefinition<ModelDefinition>[] {
        if (this.modelDefinition && this.modelDefinition.file) {
            const definitions = this.modelDefinition.file.repository.list.map(file => file.definition);
            const elements = definitions.map(definition => definition ? definition.elements : []).flat();
            const references = elements.filter(element => element.referencesElement(this));
            return references;
        }
        return [];
    }

    /**
     * Implement this method to update references this element has to the given element.
     * The given element has changed its ID and NAME attribute to the new values.
     */
    updateReferences<X extends ModelDefinition>(element: ElementDefinition<X>, oldId: string, newId: string, oldName: string, newName: string) {
    }
}
