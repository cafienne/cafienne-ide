import ServerFile from "@repository/serverfile/serverfile";
import Util from "@util/util";
import XML from "@util/xml";
import ElementDefinition from "./elementdefinition";
import ExternalReference, { ReferenceSet } from "./externalreference";
import ModelDefinition from "./modeldefinition";

// Some constants
export const EXTENSIONELEMENTS = 'extensionElements';
export const CAFIENNE_NAMESPACE = 'org.cafienne';
export const CAFIENNE_PREFIX = 'xmlns:cafienne';
export const IMPLEMENTATION_TAG = 'cafienne:implementation';

export default class XMLSerializable {
    private _name: string = '';
    private _id: string = '';
    readonly externalReferences = new ReferenceSet(this);
    extensionElement: Element;
    exportNode: any;

    /**
     * Creates a new XMLSerializeable that belongs to an optional parent.
     */
    constructor(public importNode: Element) {
        this.extensionElement = XML.getChildByTagName(this.importNode, EXTENSIONELEMENTS);
        this.name = this.parseAttribute('name');
        this.id = this.parseAttribute('id');
    }

    get id() {
        return this._id;
    }

    set id(name) {
        this._id = name;
    }

    get name() {
        return this._name;
    }

    set name(name) {
        this._name = name;
    }

    /**
     * Parses the attribute with the given name into a boolean value.
     * If the attribute does not exist, if will return the default value.
     */
    parseBooleanAttribute(name: string, defaultValue: boolean): boolean {
        const value = this.parseAttribute(name);
        if (typeof (value) == 'string') {
            if (value.toLowerCase() == 'false') return false;
            if (value.toLowerCase() == 'true') return true;
        }
        return defaultValue;
    }

    /**
     * Parse the attribute to a number, if available. Else returns default value or undefined if not given
     */
    parseNumberAttribute(name: string, defaultValue: number = NaN): number {
        const value = this.parseAttribute(name);
        const number = parseInt(value);
        if (isNaN(number)) {
            return defaultValue;
        } else {
            return number;
        }
    }

    /**
     * Parses the attribute with the given name. If it does not exist, returns the defaultValue,
     * or otherwise an empty string
     */
    parseAttribute(name: string, defaultValue: string = ''): string {
        if (this.importNode) {
            const value = this.importNode.getAttribute(name);
            if (value != null) {
                return value;
            }
        }
        return defaultValue;
    }

    parseReference<E extends ExternalReference<ModelDefinition>>(name: string, constructor?: new (element: XMLSerializable, fileName: string) => E): E {
        return this.addReference(this.parseAttribute(name), constructor);
    }

    addReference<E extends ExternalReference<ModelDefinition>>(fileName: string, constructor?: new (element: XMLSerializable, fileName: string) => E): E {
        return this.externalReferences.add(fileName, constructor);
    }

    /**
     * Parses the attribute with the given name. If it does not exist, returns the defaultValue or empty string.
     */
    parseCafienneAttribute(name: string, defaultValue: string = ''): string {
        if (this.importNode) {
            const value = this.importNode.getAttributeNS(CAFIENNE_NAMESPACE, name);
            if (value != null) {
                return value;
            }
        }
        return defaultValue;
    }

    /**
     * Searches for the first child element with the given tag name, and, if found, returns it's text content as string.
     * Or, if text content gives null, then it returns an empty string.
     */
    parseElementText(childName: string, defaultValue: string): string {
        const childElement = XML.getChildByTagName(this.importNode, childName);
        if (childElement) {
            return childElement.textContent || '';
        }
        return defaultValue;
    }

    /**
     * Searches for the first child element with the given tag name, and, if found, instantiates it with the constructor and returns it.
     */
    parseElement<X extends XMLSerializable>(childName: string, constructor: Function): X | undefined {
        return this.instantiateChild(XML.getChildByTagName(this.importNode, childName), constructor);
    }

    /**
     * Searches for all child elements with the given name, instantiates them with the constructor and adds them to the collection.
     */
    parseElements<X extends XMLSerializable>(childName: string, constructor: Function, collection: X[] = [], node = this.importNode) {
        XML.getChildrenByTagName(node, childName).forEach(childNode => this.instantiateChild(childNode, constructor, collection));
        return collection;
    }

    /**
     * Searches for the node with the specified tagName inside the <extensionElements>. If present, then an instance of the constructor is returned for it.
      */
    parseExtension<X extends XMLSerializable>(constructor: Function, tagName = (constructor as any).TAG): X {
        const node = XML.getChildByTagName(this.extensionElement, tagName);
        return this.createChild(node, constructor);
    }

    /**
     * Searches for nodes with the specified tagName inside the <extensionElements>. If present, then an instance of the constructor on the nodes and add them to the collection.
      */
    parseExtensions<X extends XMLSerializable>(constructor: Function, collection: X[] = [], tagName = (constructor as any).TAG) {
        XML.getChildrenByTagName(this.extensionElement, tagName).forEach(childNode => this.instantiateChild(childNode, constructor, collection));
        return collection;
    }

    /**
     * Searches for the cafienne:implementation tag and instantiates it with the given constructor.
     */
    parseImplementation<X extends XMLSerializable>(constructor: Function): X {
        return this.parseExtension(constructor, IMPLEMENTATION_TAG);
    }

    /**
     * Instantiates a new ElementDefinition based on the child node, or undefined if the childNode is undefined.
     * The new cmmn element will be optionally added to the collection, which can either be an Array or an Object.
     * In an Object it will be placed with the value of it's 'id' attribute.
     */
    instantiateChild<X extends XMLSerializable>(childNode: Element, constructor: Function, collection?: any): X | undefined {
        if (!childNode) {
            return undefined;
        }

        const newChild = this.createChild<X>(childNode, constructor);
        if (collection) {
            if (collection.constructor.name == 'Array') {
                collection.push(newChild);
            } else { // Treat collection as an object
                collection[newChild.id] = newChild;
            }
        }
        return newChild;
    }

    /**
     * Instantiates the constructor as a child to this element, and leaves it to the constructor to parse the childNode.
     * This method has no check on the presence of the childNode. That way it can also be used in empty CMMNExtensionDefinitions.
     */
    createChild<X extends XMLSerializable>(childNode: Element, constructor: Function): X {
        const constructorCall = constructor as any;
        return new constructorCall(childNode, (this as any).modelDefinition, this);
    }

    /**
     * Invoked right before the property is being deleted from this object
     */
    removeProperty(propertyName: string) {
    }

    /**
     * Method invoked after deletion of some other definition element
     * Can be used to remove references to that other definition element.
     */
    removeDefinitionReference(removedElement: XMLSerializable) {
        for (const key in this) {
            const value: any = this[key];
            if (value === removedElement) {
                // console.log("Deleted value "+this.constructor.name+"["+this.name+"]"+".'"+key+"'");
                delete this[key];
            } else if (value instanceof Array) {
                const removed = Util.removeFromArray(value, removedElement);
                // if (removed > -1) {
                //     console.log("Removed " + removedElement.constructor.name + " from " + this.constructor.name + "[" + this.name + "]" + "." + key + "[]");
                // }
            } else if (typeof (value) === 'string') {
                // If it is a string, and it has a non-empty value, and they are equal (and 'this !== removedElement', as that is the first check)
                if (value && removedElement.id && value === removedElement.id) {
                    // console.log("Deleting string reference "+this.constructor.name+"["+this.name+"]"+".'"+key+"'");
                    console.groupCollapsed(`Clearing ${this}.${key} = ${removedElement}`);
                    this.removeProperty(key);
                    delete this[key];
                    console.groupEnd();
                }
            } else {
                // console.log("Found property "+key+" which is of type "+typeof(value));
            }
        }
    }

    /**
     * Introspects the properties by name and exports them to XML based on their type.
     */
    exportProperties(...propertyNames: any[]) {
        propertyNames.forEach(propertyName => {
            if (typeof (propertyName) == 'string') {
                this.exportProperty(propertyName, (this as any)[propertyName]);
            } else { // Probably an array
                if (propertyName.constructor.name == 'Array') { // It is actually an array of something (e.g. of string or even again of array)
                    propertyName.forEach((name: string) => this.exportProperties(name));
                } else {
                    console.warn('Cannot recognize property name, because it is not of type string or array but ' + propertyName.constructor.name + '\n', propertyName);
                }
            }
        });
    }

    /**
     * Exports the property with the given name and value into XML. PropertyValue can be anything,
     * and it's type determines how the property is exported to XML. If it is undefined or null, nothing happens.
     * If it is an array, each individual element will be inspected and exported (invoking this method recursively).
     * If it is an instanceof CMMNElementDefinition (i.e., if it is a child property), then the createExportNode of that child is invoked with
     * this.exportNode as the parentNode.
     * If it is something else, then it is exported as an xml attribute.
     */
    exportProperty(propertyName: string, propertyValue: any) {
        // Do not write '' or 'undefined' attributes.
        if (propertyValue === undefined) return;
        if (propertyValue === '') return;
        // Hmmmm.... Null properties is bad code smell?
        if (propertyValue === null) return;
        if (propertyValue.constructor.name == 'Array') {
            // Convert arrays into individual property-writes
            propertyValue.forEach((singularPropertyValue: any) => this.exportProperty(propertyName, singularPropertyValue));
        } else if (propertyValue instanceof ElementDefinition) {
            // Write XML properties as-is, without converting them to string
            propertyValue.createExportNode(this.exportNode, propertyName);
        } else if (propertyValue instanceof ExternalReference) {
            // Write references only if they have a value
            if (propertyValue.fileName !== '') {
                this.exportNode?.setAttribute(propertyName, propertyValue.fileName);
            }
        } else {
            if (typeof (propertyValue) == 'object') {
                console.warn('Writing property ' + propertyName + ' has a value of type object', propertyValue);
            }

            // Convert all values to string
            const stringifiedValue = propertyValue.toString()
            // If the "toString" version of the property still has a value, then write it into the attribute
            if (stringifiedValue) {
                this.exportNode?.setAttribute(propertyName, propertyValue);
            }
        }
    }

    /**
     * Exports this element with its properties to an XML element and appends it to the parentNode.
     * If first creates the .exportNode XML element, then introspects each of the given property names and invokes the appropriate export logic on it.
     */
    createExportNode(parentNode: Element, tagName: string, ...propertyNames: any[]) {
        this.exportNode = XML.createChildElement(parentNode, tagName);
        this.exportProperties('id', 'name', propertyNames);
    }

    /**
     * Creates and returns an extension element with a custom tag inside having the given tagName (it defaults to <cafienne:implementation xmlns:cafienne="org.cafienne">).
     */
    createExtensionNode(parentNode: Element, tagName = IMPLEMENTATION_TAG, ...propertyNames: any[]) {
        this.exportNode = XML.createChildElement(this.getExtensionsElement(parentNode), tagName);
        const prefixAndLocalName = tagName.split(':');
        const prefix = `xmlns${prefixAndLocalName.length === 1 ? '' : ':' + prefixAndLocalName[0]}`;
        this.exportNode.setAttribute(prefix, CAFIENNE_NAMESPACE);
        this.exportProperties(propertyNames);
        return this.exportNode;
    }

    getExtensionsElement(parentNode = this.exportNode) {
        let element = XML.getChildByTagName(parentNode, EXTENSIONELEMENTS);
        if (!element) {
            element = XML.createChildElement(parentNode, EXTENSIONELEMENTS);
            element.setAttribute('mustUnderstand', 'false');
        }
        return element;
    }

    /**
     * Creates and returns a <cafienne:implementation xmlns:cafienne="org.cafienne"> node and returns it.
     * Does NOT set the class attribute on it (e.g. for WorkflowTaskDefinition)
     */
    createImplementationNode() {
        return this.createExtensionNode(this.exportNode, IMPLEMENTATION_TAG);
    }

    /**
     * Basic method invoked on an element after the entire XML tree has been parsed.
     * Can be used to resolve string based references to other elements.
     */
    resolveInternalReferences() { }

    /**
     * Mechanism to load the file that is referenced from an ExternalReference
     * @param fileName 
     */
    loadFile<M extends ModelDefinition>(fileName: string): ServerFile<M> | undefined {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    /**
     * Method invoked when this element has ExternalReference objects that have a file that has a definition.
     * This can be used to set a pointer to the definition that is referenced.
     */
    resolveExternalReferences() {
    }

    /**
     * Returns true if this object has a reference to the element.
     * This method by default returns false, but can be overwritten to define actual comparison.
     */
    referencesElement(element: XMLSerializable): boolean {
        return false;
    }

    /**
     * Returns elements in models that reference this element
     */
    searchInboundReferences(): ElementDefinition<ModelDefinition>[] {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    /**
     * Exports the IDs of all elements in the list (that have an id) into a space-separated string
     */
    flattenListToString(list: any[]): string {
        return list && list.length > 0 ? list.filter(item => item.id).map(item => item.id).join(' ') : '';
    }

    toString() {
        return this.constructor.name;
    }

    /**
     * Prints a log message that shows the difference between the import and the export node of this element.
     */
    logDiff() {
        console.group('Import and export nodes for ' + this);
        console.log('Imported node: ' + XML.prettyPrint(this.importNode));
        console.log('Export node: ' + XML.prettyPrint(this.exportNode));
        console.groupEnd();
    }
}
