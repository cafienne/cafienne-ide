import { andThen } from "@util/promise/followup";
import SequentialFollowupList from "@util/promise/sequentialfollowuplist";
import Util from "@util/util";
import XML from "@util/xml";
import ServerFile from "../serverfile/serverfile";
import CMMNDocumentationDefinition from "./cmmndocumentationdefinition";
import TypeCounter from "./typecounter";
import ElementDefinition from "./elementdefinition";
import XMLSerializable from "./xmlserializable";
import ParameterDefinition from "./contract/parameterdefinition";

/**
 * A ModelDefinition is the base class of a model, such as CaseDefinition, ProcessDefinition, HumanTaskDefinition, CaseFileDefinitionDefinition 
 */
export default class ModelDefinition extends XMLSerializable {
    modelDefinition: this;
    private __documentation?: CMMNDocumentationDefinition<this>;
    private __migrated: boolean = false;
    private static getImportNode(file: ServerFile<ModelDefinition>): Element {
        if (!file.xml) {
            throw new Error('Expected an XML element')
        }
        return file.xml;
    }

    typeCounters = new TypeCounter(this);
    elements: ElementDefinition<ModelDefinition>[] = [];
        
    /**
     * Imports an XML element and parses it into a in-memory definition structure.
     * @param {ServerFile} file
     * @param {Element} importNode 
     */
    constructor(public file: ServerFile<ModelDefinition>, importNode = ModelDefinition.getImportNode(file)) {
        // Need to pass undefined in the super, and then set the modelDefinition manually.
        super(importNode);
        this.modelDefinition = this;
        /** @type {Array<ElementDefinition>} */
        (this.elements as any).push(this);
        this.parseDocumentationElement();
    }

    validateDocument() {
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

    /**
     * Creates a new instance of the constructor with an optional id and name
     * attribute. If these are not given, the logic will generate id and name for it based
     * on the type of element and the other content inside the case definition.
     * @param {Function} constructor 
     * @param {ElementDefinition} parent 
     * @param {String} id 
     * @param {String} name 
     * @returns {*} an instance of the constructor that is expected to extend CMMNElementDefinition
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
     * Asynchronously load all external references that this definition has.
     * @param {() => void} callback 
     */
    loadDependencies(callback: () => void) {
        const referencingElements = this.elements.filter(element => element.hasExternalReferences());
        Util.removeDuplicates(referencingElements);
        if (referencingElements.length === 0) {
            callback();
            return;
        }
        console.groupCollapsed("Loading dependencies of " + this.file.fileName);
        console.log(`${this.file.fileName} has ${referencingElements.length} elements with external dependencies (out of ${this.elements.length} elements)`);
        const todo = new SequentialFollowupList(andThen(() => {
            // console.log(`${this.file.fileName} completed dependencies`);
            console.groupEnd();
            callback();
        }));
        referencingElements.forEach(element => todo.add(callback => element.loadExternalReferences(callback)));
        todo.run();
    }

    /**
     * A ModelDefinition must have input parameters.
     * @returns {Array<ParameterDefinition>}
     */
    get inputParameters(): ParameterDefinition<ModelDefinition>[] {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    /**
     * A ModelDefinition must have output parameters.
     * @returns {Array<ParameterDefinition>}
     */
    get outputParameters(): ParameterDefinition<ModelDefinition>[] {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    /**
     * 
     * @param {String} identifier 
     * @returns {ParameterDefinition}
     */
    findInputParameter(identifier: string) {
        return this.inputParameters.find(p => p.hasIdentifier(identifier));
    }

    /**
     * 
     * @param {String} identifier 
     * @returns {ParameterDefinition}
     */
    findOutputParameter(identifier: string) {
        return this.outputParameters.find(p => p.hasIdentifier(identifier));
    }

    /**
     * Informs all elements in the case definition about the removal of the element
     * @param {ElementDefinition} removedElement 
     */
    removeDefinitionElement<M extends ModelDefinition>(removedElement: ElementDefinition<M>) {
        // Go through other elements and tell them to say goodbye to removedElement;
        //  we do this in reverse order, to have removal from CaseDefinition as last.
        this.elements.slice().reverse().filter(e => e != removedElement).forEach(element => element.removeDefinitionReference(removedElement));
    }

    /**
     * Returns the element that has the specified identifier, or undefined.
     * If the constructor argument is specified, the element is checked against the constructor with 'instanceof'
     * @param {String} id 
     * @param {Function} constructor
     * @returns {ElementDefinition}
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

    exportModel(tagName: string, ...propertyNames: any[]) {
        const xmlDocument = XML.loadXMLString(`<${tagName} />`); // TODO: add proper namespace and so.
        this.exportNode = xmlDocument.documentElement;
        this.exportProperties('id', 'name', 'documentation', propertyNames);
        return xmlDocument;
    }

    toXML(): Document {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    hasMigrated(): boolean {
        return this.__migrated === true;
    }

    migrated(msg: string) {
        console.log(msg);
        // console.warn(`Setting migrated to ${migrated} for ${this.modelDocument.fileName}`);
        this.__migrated = true;
    }
}
