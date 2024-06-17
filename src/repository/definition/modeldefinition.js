import Util from "../../util/util";
import XML from "../../util/xml";
import ServerFile from "../serverfile";
import ReferableElementDefinition from "./referableelementdefinition";
import XMLElementDefinition from "./xmlelementdefinition";

/**
 * A ModelDefinition is the base class of a model, such as CaseDefinition, ProcessDefinition, HumanTaskDefinition, CaseFileDefinitionDefinition 
 */
export default class ModelDefinition extends ReferableElementDefinition {
    /**
     * Imports an XML element and parses it into a in-memory definition structure.
     * @param {ServerFile} file
     * @param {Element} importNode 
     */
    constructor(file, importNode = file.content.xml) {
        // Need to pass undefined in the super, and then set the modelDefinition manually.
        super(importNode, undefined, undefined);
        this.modelDefinition = this;
        this.file = file;
        this.typeCounters = new TypeCounter(this);
        /** @type {Array<XMLElementDefinition>} */
        this.elements = [];
        this.elements.push(this);
    }

    parseDocument() {
        this.parseElementProperties();
    }

    validateDocument() {
    }

    /**
     * Asynchronously load all external references that this definition has.
     * @param {() => void} callback 
     */
    loadDependencies(callback) {
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
    get inputParameters() {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    /**
     * A ModelDefinition must have output parameters.
     * @returns {Array<ParameterDefinition>}
     */
    get outputParameters() {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    /**
     * 
     * @param {String} identifier 
     * @returns {ParameterDefinition}
     */
    findInputParameter(identifier) {
        return this.inputParameters.find(p => p.hasIdentifier(identifier));
    }

    /**
     * 
     * @param {String} identifier 
     * @returns {ParameterDefinition}
     */
    findOutputParameter(identifier) {
        return this.outputParameters.find(p => p.hasIdentifier(identifier));
    }

    /**
     * Informs all elements in the case definition about the removal of the element
     * @param {XMLElementDefinition} removedElement 
     */
    removeDefinitionElement(removedElement) {
        // Go through other elements and tell them to say goodbye to removedElement;
        //  we do this in reverse order, to have removal from CaseDefinition as last.
        this.elements.slice().reverse().filter(e => e != removedElement).forEach(element => element.removeDefinitionReference(removedElement));
    }

    /**
     * Returns the element that has the specified identifier, or undefined.
     * If the constructor argument is specified, the element is checked against the constructor with 'instanceof'
     * @param {String} id 
     * @param {Function} constructor
     * @returns {XMLElementDefinition}
     */
    getElement(id, constructor = undefined) {
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

    getNextIdOfType(constructor) {
        return this.typeCounters.getNextIdOfType(constructor);
    }

    getNextNameOfType(constructor) {
        return this.typeCounters.getNextNameOfType(constructor);
    }

    /**
     * In CMMN some of the references are string based, and sometimes there are multiple references within the same
     * string, limited by space. This function analyzes such a string, and adds all references that could be found into the array.
     * If constructor is specified, the found elements must match (element instanceof constructor).
     * @param {String} idString 
     * @param {Array} collection 
     * @param {*} constructor
     */
    findElements(idString, collection, constructor) {
        idString = idString || '';
        idString.split(' ').forEach(reference => {
            const element = reference && this.getElement(reference, constructor);
            element && collection.push(element);
        });
        return collection;
    }

    /**
     * 
     * @param {String} tagName 
     * @param  {...String} propertyNames 
     */
    exportModel(tagName, ...propertyNames) {
        const xmlDocument = XML.loadXMLString(`<${tagName} />`); // TODO: add proper namespace and so.
        this.exportNode = xmlDocument.documentElement;
        this.exportProperties('id', 'name', 'documentation', propertyNames);
        return xmlDocument;
    }

    /**
     * @returns {Document}
     */
    toXML() {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    /**
     * @returns {Boolean}
     */
    hasMigrated() {
        return this.__migrated === true;
    }

    /**
     * @param {String} msg
     */
    migrated(msg) {
        console.log(msg);
        // console.warn(`Setting migrated to ${migrated} for ${this.modelDocument.fileName}`);
        this.__migrated = true;
    }
}
