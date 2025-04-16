import Util from "../../util/util";
import XML, { Document, Element } from "../../util/xml";
import ServerFile from "../serverfile/serverfile";
import CMMNDocumentationDefinition from "./cmmndocumentationdefinition";
import ParameterDefinition from "./contract/parameterdefinition";
import ElementDefinition from "./elementdefinition";
import TypeCounter from "./typecounter";
import XMLSerializable from "./xmlserializable";

/**
 * A ModelDefinition is the base class of a model, such as CaseDefinition, ProcessDefinition, HumanTaskDefinition, CaseFileDefinitionDefinition 
 */
abstract class ModelDefinition extends XMLSerializable {
    modelDefinition: this;
    private __documentation?: CMMNDocumentationDefinition<this>;
    private __migrated: boolean = false;
    private static getImportNode(file: ServerFile<ModelDefinition>): Element {
        if (!file.xml) {
            throw new Error('Expected an XML element');
        }
        return file.xml;
    }

    typeCounters = new TypeCounter(this);
    elements: ElementDefinition<ModelDefinition>[] = [];

    /**
     * Imports an XML element and parses it into a in-memory definition structure.
     */
    constructor(public file: ServerFile<ModelDefinition>, public readonly importNode: Element = ModelDefinition.getImportNode(file)) {
        // Need to pass undefined in the super, and then set the modelDefinition manually.
        super(importNode);
        this.modelDefinition = this;
        /** @type {Array<ElementDefinition>} */
        (this.elements as any).push(this);
        this.parseDocumentationElement();
    }

    /**
     * Initialize resolves both internal and external references and validates the definition.
     */
    initialize() {
        const externalReferences = this.elements.map(element => element.externalReferences.all.filter(e => e.nonEmpty)).flat().map(e => e.fileName);
        Util.removeDuplicates(externalReferences);
        if (externalReferences.length > 0) {
            console.groupCollapsed(`Initializing ${this.file.fileName} with ${externalReferences.length} external dependencies`);
            // console.groupCollapsed(`Initializing ${this.file.fileName} with ${externalReferences.length} dependencies [${externalReferences.join(', ')}]`);

            // Find elements that have an external reference
            const referencingElements = this.elements.filter(element => element.externalReferences.all.filter(e => e.nonEmpty).length);
            console.log(`${this.file} has ${referencingElements.length} elements with external dependencies (out of ${this.elements.length} elements)`);
        }
        // Tell all elements to resolve their references. First the external ones, and then tell all elements to resolve the internal ones.
        // This order is needed, because an element may refer to content inside an external reference.
        this.elements.forEach(element => element.resolveExternalReferences());
        this.elements.forEach(element => element.resolveInternalReferences());
        if (externalReferences.length > 0) {
            console.groupEnd();
        }
        return this;
    }

    parseDocumentationElement() {
        const documentationElement = XML.getChildByTagName(this.importNode, 'documentation');
        if (documentationElement) {
            this.__documentation = CMMNDocumentationDefinition.createDocumentationElement(documentationElement, this, undefined);
        }
        // Now check whether or not to convert the deprecated 'description' attribute
        const description = this.parseAttribute('description');
        if (description && !this.documentation.text) {
            this.migrated(`Migrating CMMN1.0 description attribute to <cmmn:documentation> element in ${this.constructor.name} '${this.name}'`);
            this.documentation.text = description;
        }
    }

    /**
     * @returns {CMMNDocumentationDefinition}
     */
    get documentation() {
        if (!this.__documentation) {
            this.__documentation = CMMNDocumentationDefinition.createDocumentationElement(undefined, this, undefined);
        }
        return this.__documentation;
    }

    addElement(element: ElementDefinition<ModelDefinition>) {
        // console.warn(this.file.fileName +": adding a " + element.constructor.name)
        this.elements.push(element);
    }

    /**
     * Option to create an import node for a new definition if that definition does not have an import node available.
     */
    createImportNode(tag: string): Element {
        const document = this.importNode.ownerDocument;
        if (!document) {
            const error = new Error("Right. and that on an Element...");
            console.error(error);
            throw error;
        }
        return document.createElement(tag);
    }

    /**
     * Creates a new instance of the constructor with an optional id and name
     * attribute. If these are not given, the logic will generate id and name for it based
     * on the type of element and the other content inside the case definition.
     * @returns an instance of the constructor that is expected to extend CMMNElementDefinition
     */
    createDefinition<M extends ModelDefinition, T extends ElementDefinition<M>>(constructor: Function, parent?: ElementDefinition<M>, id?: string, name?: string): T {
        const element = new (constructor as any)(undefined, this.modelDefinition, parent);
        element.id = id ? id : this.getNextIdOfType(constructor);
        if (name !== undefined || element.isNamedElement()) {
            element.name = name !== undefined ? name : this.getNextNameOfType(constructor);
        }
        return element;
    }

    /**
     * A ModelDefinition must have input parameters.
     */
    abstract get inputParameters(): ParameterDefinition<ModelDefinition>[];

    /**
     * A ModelDefinition must have output parameters.
     */
    abstract get outputParameters(): ParameterDefinition<ModelDefinition>[];

    findInputParameter(identifier: string) {
        return this.inputParameters.find(p => p.hasIdentifier(identifier));
    }

    findOutputParameter(identifier: string) {
        return this.outputParameters.find(p => p.hasIdentifier(identifier));
    }

    /**
     * Informs all elements in the model definition about the removal of the element
     */
    removeDefinitionElementReferences<M extends ModelDefinition>(removedElement: ElementDefinition<M>) {
        // Go through other elements and tell them to say goodbye to removedElement;
        //  we do this in reverse order, to have removal from ModelDefinition as last (which removes the element from this.elements[] array)
        this.elements.slice().reverse().filter(e => e != removedElement).forEach(element => element.removeDefinitionReference(removedElement));
    }

    /**
     * Returns the element that has the specified identifier, or undefined.
     * If the constructor argument is specified, the element is checked against the constructor with 'instanceof'
     */
    getElement(id: string, constructor?: Function): ElementDefinition<ModelDefinition> | undefined {
        const element = this.elements.find(element => id && element.id == id); // Filter first checks whether id is undefined;
        if (constructor && element) {
            if (element instanceof constructor) {
                return element;
            } else {
                console.warn('Found the element with id ' + id + ', but it is not of type ' + constructor.name + ' but ', element.constructor.name)
                return undefined;
            }
        } else {
            return element;
        }
    }

    getNextIdOfType(constructor: Function) {
        return this.typeCounters.getNextIdOfType(constructor);
    }

    getNextNameOfType(constructor: Function) {
        return this.typeCounters.getNextNameOfType(constructor);
    }

    loadFile<M extends ModelDefinition>(fileName: string): ServerFile<M> | undefined {
        return <ServerFile<M>>this.file.repository.getFile(fileName);
    }

    /**
     * In CMMN some of the references are string based, and sometimes there are multiple references within the same
     * string, limited by space. This function analyzes such a string, and adds all references that could be found into the array.
     * If constructor is specified, the found elements must match (element instanceof constructor).
     */
    findElements(idString: string, collection: any[], constructor?: Function) {
        idString = idString || '';
        idString.split(' ').forEach(reference => {
            const element = reference && this.getElement(reference, constructor);
            element && collection.push(element);
        });
        return collection;
    }

    /**
     * Returns all elements that have a reference to this element
     */
    searchInboundReferences(): ElementDefinition<ModelDefinition>[] {
        if (this.file) {
            const definitions = this.file.repository.list.map(file => file.definition);
            const elements = definitions.map(definition => definition ? definition.elements : []).flat();
            const references = elements.filter(element => element.referencesElement(this));
            console.log(`${this.file}: Returning ${references.length} inbound referneces`);
            return references;
        }
        return [];
    }

    exportModel(tagName: string, ...propertyNames: any[]) {
        const xmlDocument = XML.loadXMLString(`<${tagName} xmlns="http://www.omg.org/spec/CMMN/20151109/MODEL" xmlns:cafienne="org.cafienne" />`);
        this.exportNode = xmlDocument.documentElement;
        this.exportProperties('id', 'name', 'documentation', propertyNames);
        return xmlDocument;
    }

    abstract toXML(): Document;

    toXMLString(): string {
        return XML.prettyPrint(this.toXML());
    }

    toString() {
        return `${this.constructor.name} ${this.file.fileName}`;
    }

    hasMigrated(): boolean {
        return this.__migrated === true;
    }

    migrated(msg: string) {
        console.log(msg);
        // console.warn(`Setting migrated to ${migrated} for ${this.modelDocument.fileName}`);
        this.__migrated = true;
    }

    /**
     * Returns a list of all other models that this definition relies on, including their dependents.
     * @returns 
     */
    dependencies(): ModelDefinition[] {
        const dependents: ModelDefinition[] = [];
        const addReferencedModels = (model: ModelDefinition) => model.elements.map(e => e.externalReferences.all).flat().filter(e => e.nonEmpty).map(e => e.getDefinition()).filter(definition => definition !== undefined).forEach(definition => addDependency(definition));
        const addDependency = (model: ModelDefinition) => {
            if (dependents.indexOf(model) < 0) {
                dependents.push(model);
                addReferencedModels(model);
            }
        }
        addReferencedModels(this);
        return dependents;
    }
}

export default ModelDefinition;