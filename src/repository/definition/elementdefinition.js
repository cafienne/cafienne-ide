import ModelDefinition from "./modeldefinition";
import XMLSerializable from "./xmlserializable";

export default class ElementDefinition extends XMLSerializable {
    /**
     * Creates a new ElementDefinition that belongs to the Definition object.
     * @param {Element} importNode 
     * @param {ModelDefinition} modelDefinition 
     * @param {ElementDefinition} parent 
     */
    constructor(importNode, modelDefinition, parent = undefined) {
        super(importNode, parent);
        this.modelDefinition = modelDefinition;
        if (modelDefinition) {
            this.modelDefinition.elements.push(this);
        }
    }

    /**
     * Creates a new instance of the constructor with an optional id and name
     * attribute. If these are not given, the logic will generate id and name for it based
     * on the type of element and the other content inside the case definition.
     * @param {Function} constructor 
     * @param {String} id 
     * @param {String} name 
     * @returns {*} an instance of the constructor that is expected to extend CMMNElementDefinition
     */
    createDefinition(constructor, id = undefined, name = undefined) {
        return this.modelDefinition.createDefinition(constructor, this, id, name);
    }

    isNamedElement() {
        return true;
    }

    removeDefinition(log = true) {
        if (log) console.group("Removing " + this);
        // First, delete our children in the reverse order that they were created.
        this.childDefinitions.slice().reverse().forEach(child => {
            console.group('Removing ' + child);
            child.removeDefinition(false);
            // console.groupEnd();
        });
        // Next, inform the case definition about it.
        this.modelDefinition.removeDefinitionElement(this);
        // Finally remove all our properties.
        for (const key in this) delete this[key];
        console.groupEnd();
    }

    /**
     * Basic method invoked on an element after the entire XML tree has been parsed.
     * Can be used to resolve string based references to other elements.
     */
    resolveReferences() { }

    /**
     * Returns all elements that have a reference to this element
     * @returns {Array<ElementDefinition>}
     */
    searchInboundReferences() {
        if (this.modelDefinition && this.modelDefinition.file) {
            const definitions = this.modelDefinition.file.repository.list.map(file => file.definition);
            const elements = definitions.map(definition => definition.elements).flat();
            const references = elements.filter(element => element.referencesElement(this));
            return references;
        }
        return [];
    }

    /**
     * Returns true if this ElementDefinition has a reference to the element.
     * This method by default returns false, but can be overwritten to define actual comparison.
     * @param {ElementDefinition} element 
     * @returns 
     */
    referencesElement(element) {
        return false;
    }

    hasExternalReferences() {
        return false;
    }

    loadExternalReferences(callback) {
        callback();
    }

    /**
     * Asynchronously load a ModelDefinition
     * @param {String} fileName 
     * @param {(definition: ModelDefinition|undefined) => void} callback
     */
    resolveExternalDefinition(fileName, callback) {
        console.groupCollapsed(`${this.constructor.name}${this.name ? '[' + this.name + ']' : ''} requires '${fileName}'`);

        this.modelDefinition.file.loadReference(fileName, file => {
            console.groupEnd();
            callback(file ? file.definition : undefined)
        });
    }
}
