// import ModelDefinition from "./modeldefinition";

// Some constants
export const EXTENSIONELEMENTS = 'extensionElements';
export const CAFIENNE_NAMESPACE = 'org.cafienne';
export const CAFIENNE_PREFIX = 'xmlns:cafienne';
export const IMPLEMENTATION_TAG = 'cafienne:implementation';

export default class XMLElementDefinition {
    /**
     * Creates a new XMLElementDefinition that belongs to the Definition object.
     * @param {Element} importNode 
     * @param {ModelDefinition} modelDefinition 
     * @param {XMLElementDefinition} parent 
     */
    constructor(importNode, modelDefinition, parent = undefined) {
        this.importNode = importNode;
        this.extensionElement = XML.getChildByTagName(this.importNode, EXTENSIONELEMENTS);
        this.modelDefinition = modelDefinition;
        if (modelDefinition) {
            this.modelDefinition.elements.push(this);
        }
        this.parent = parent;
        this.childDefinitions = [];
        if (this.parent) {
            this.parent.childDefinitions.push(this);
        }
    }

    /**
     * Parses the attribute with the given name into a boolean value.
     * If the attribute does not exist, if will return the default value.
     * @param {*} name
     * @param {Boolean} defaultValue
     * @returns {Boolean}
     */
    parseBooleanAttribute(name, defaultValue) {
        const value = this.parseAttribute(name, defaultValue);
        if (typeof (value) == 'string') {
            if (value.toLowerCase() == 'false') return false;
            if (value.toLowerCase() == 'true') return true;
        }
        return defaultValue;
    }

    /**
     * 
     * @param {String} name 
     * @param {Number} defaultValue 
     * @returns {Number}
     */
    parseNumberAttribute(name, defaultValue = undefined) {
        const value = this.parseAttribute(name, defaultValue);
        const number = parseInt(value);
        if (isNaN(number)) {
            return defaultValue;
        } else {
            return number;
        }
    }

    /**
     * Parses the attribute with the given name. If it does not exist, returns the defaultValue
     * @param {String} name 
     * @param {*} defaultValue 
     * @returns {String}
     */
    parseAttribute(name, defaultValue = undefined) {
        if (this.importNode) {
            const value = this.importNode.getAttribute(name);
            if (value != null) {
                return value;
            }
        }
        return defaultValue;
    }

    /**
     * Parses the attribute with the given name. If it does not exist, returns the defaultValue
     * @param {String} name 
     * @param {*} defaultValue 
     * @returns {String}
     */
    parseCafienneAttribute(name, defaultValue = undefined) {
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
     * @param {String} childName 
     * @param {String} defaultValue
     * @returns {String}
     */
    parseElementText(childName, defaultValue) {
        const childElement = XML.getChildByTagName(this.importNode, childName);
        if (childElement) {
            return childElement.textContent;
        }
        return defaultValue;
    }

    /**
     * Searches for the first child element with the given tag name, and, if found, instantiates it with the constructor and returns it.
     * @param {String} childName 
     * @param {Function} constructor 
     * @returns {*}
     */
    parseElement(childName, constructor) {
        return this.instantiateChild(XML.getChildByTagName(this.importNode, childName), constructor);
    }

    /**
     * Searches for all child elements with the given name, instantiates them with the constructor and adds them to the collection.
     * @param {String} childName 
     * @param {Function} constructor 
     * @param {*} collection 
     * @returns {Array<*>}
     */
    parseElements(childName, constructor, collection = [], node = this.importNode) {
        XML.getChildrenByTagName(node, childName).forEach(childNode => this.instantiateChild(childNode, constructor, collection));
        return collection;
    }

    /**
     * Searches for the node with the specified tagName inside the <extensionElements>. If present, then an instance of the constructor is returned for it.
      * 
      * @param {Function} constructor 
      * @param {String} tagName
      * @returns {*} an instance of the given constructor if the extension element is found.
      */
    parseExtension(constructor, tagName = constructor.TAG) {
        const node = XML.getChildByTagName(this.extensionElement, tagName);
        return this.createChild(node, constructor);
    }

    /**
     * Searches for nodes with the specified tagName inside the <extensionElements>. If present, then an instance of the constructor on the nodes and add them to the collection.
      * 
      * @param {Function} constructor 
      * @param {String} tagName
      * @returns {Array<*>} The collection of parsed nodes in the extension element.
      */
    parseExtensions(constructor, collection = [], tagName = constructor.TAG) {
        XML.getChildrenByTagName(this.extensionElement, tagName).forEach(childNode => this.instantiateChild(childNode, constructor, collection));
        return collection;
    }

    /**
     * Searches for the cafienne:implementation tag and instantiates it with the given constructor.
     * @param {Function} constructor 
     * @returns {*}
     */
    parseImplementation(constructor) {
        return this.parseExtension(constructor, IMPLEMENTATION_TAG);
    }

    /**
     * Instantiates a new XMLElementDefinition based on the child node, or undefined if the childNode is undefined.
     * The new cmmn element will be optionally added to the collection, which can either be an Array or an Object.
     * In an Object it will be placed with the value of it's 'id' attribute.
     * @param {Node} childNode 
     * @param {Function} constructor 
     * @param {*} collection 
     */
    instantiateChild(childNode, constructor, collection = undefined) {
        if (!childNode) {
            return undefined;
        }

        const newChild = this.createChild(childNode, constructor);
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
     * 
     * @param {Node} childNode 
     * @param {Function} constructor
     * @returns {XMLElementDefinition} Returns an instance of XMLElementDefinition
     */
    createChild(childNode, constructor) {
        return new constructor(childNode, this.modelDefinition, this);
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
        const element = new constructor(undefined, this.modelDefinition, this);
        element.id = id ? id : this.modelDefinition.getNextIdOfType(constructor);
        if (name !== undefined || element.isNamedElement()) {
            element.name = name !== undefined ? name : this.modelDefinition.getNextNameOfType(constructor);
        }
        return element;
    }

    isNamedElement() {
        return true;
    }

    /**
     * Method invoked after deletion of some other definition element
     * Can be used to remove references to that other definition element.
     * @param {XMLElementDefinition} removedElement 
     */
    removeDefinitionReference(removedElement) {
        for (const key in this) {
            /** @type {*} */
            const value = this[key];
            if (value === removedElement) {
                // console.log("Deleted value "+this.constructor.name+"["+this.name+"]"+".'"+key+"'");
                delete this[key];
            } else if (value instanceof Array) {
                const removed = Util.removeFromArray(value, removedElement);
                // if (removed > -1) {
                //     console.log("Removed "+element.constructor.name+" from "+this.constructor.name+"["+this.name+"]"+"."+key+"[]");
                // }
            } else if (typeof (value) === 'string') {
                // If it is a string, and it has a non-empty value, and they are equal (and 'this !== removedElement', as that is the first check)
                if (value && removedElement.id && value === removedElement.id) {
                    // console.log("Deleting string reference "+this.constructor.name+"["+this.name+"]"+".'"+key+"'");
                    console.log('Clearing ' + key + ' "' + removedElement.id + '" from ' + this);
                    this.removeProperty(key);
                    delete this[key];
                }
            } else {
                // console.log("Found property "+key+" which is of type "+typeof(value));
            }
        }
    }

    /**
     * Invoked right before the property is being deleted from this object
     * @param {String} propertyName 
     */
    removeProperty(propertyName) {
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
     * Introspects the properties by name and exports them to XML based on their type.
     * @param {Array} propertyNames 
     */
    exportProperties(...propertyNames) {
        propertyNames.forEach(propertyName => {
            if (typeof (propertyName) == 'string') {
                this.exportProperty(propertyName, this[propertyName]);
            } else { // Probably an array
                if (propertyName.constructor.name == 'Array') { // It is actually an array of something (e.g. of string or even again of array)
                    propertyName.forEach(name => this.exportProperties(name));
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
     * @param {String} propertyName 
     * @param {*} propertyValue 
     */
    exportProperty(propertyName, propertyValue) {
        // Do not write '' or 'undefined' attributes.
        if (propertyValue === undefined) return;
        if (propertyValue === '') return;
        // Hmmmm.... Null properties is bad code smell?
        if (propertyValue === null) return;
        if (propertyValue.constructor.name == 'Array') {
            // Convert arrays into individual property-writes
            propertyValue.forEach(singularPropertyValue => this.exportProperty(propertyName, singularPropertyValue));
        } else if (propertyValue instanceof XMLElementDefinition) {
            // Write XML properties as-is, without converting them to string
            propertyValue.createExportNode(this.exportNode, propertyName);
        } else {
            if (typeof (propertyValue) == 'object') {
                console.warn('Writing property ' + propertyName + ' has a value of type object', propertyValue);
            }

            // Convert all values to string
            const stringifiedValue = propertyValue.toString()
            // If the "toString" version of the property still has a value, then write it into the attribute
            if (stringifiedValue) {
                this.exportNode.setAttribute(propertyName, propertyValue);
            }
        }
    }

    /**
     * Exports this element with its properties to an XML element and appends it to the parentNode.
     * If first creates the .exportNode XML element, then introspects each of the given property names and invokes the appropriate export logic on it.
     * @param {Node} parentNode 
     * @param {String} tagName 
     * @param {Array} propertyNames
     */
    createExportNode(parentNode, tagName, ...propertyNames) {
        this.exportNode = XML.createChildElement(parentNode, tagName);
        this.exportProperties(propertyNames);
    }

    /**
     * Creates and returns an extension element with a custom tag inside having the given tagName (it defaults to <cafienne:implementation xmlns:cafienne="org.cafienne">).
     * @param {String} tagName 
     */
    createExtensionNode(parentNode, tagName = IMPLEMENTATION_TAG, ...propertyNames) {
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
    resolveReferences() { }

    /**
     * Returns all elements that have a reference to this element
     * @returns {Array<XMLElementDefinition>}
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
     * Returns true if this XMLElementDefinition has a reference to the element.
     * This method by default returns false, but can be overwritten to define actual comparison.
     * @param {XMLElementDefinition} element 
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

    /**
     * Exports the IDs of all elements in the list (that have an id) into a space-separated string
     * @param {Array} list 
     */
    flattenListToString(list) {
        return list && list.length > 0 ? list.filter(item => item.id).map(item => item.id).join(' ') : undefined;
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
