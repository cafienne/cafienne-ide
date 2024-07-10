import XML from "@util/xml";
import ElementDefinition from "./elementdefinition";

// Some constants
export const EXTENSIONELEMENTS: string = 'extensionElements';
export const CAFIENNE_NAMESPACE: string = 'org.cafienne';
export const CAFIENNE_PREFIX: string = 'xmlns:cafienne';
export const IMPLEMENTATION_TAG: string = 'cafienne:implementation';

export default class XMLSerializable {
    extensionElement: Element;
    name: string;
    id: string;
    childDefinitions: XMLSerializable[];
    private _exportNode?: Element;
    private modelDefinition? : XMLSerializable;

    constructor(public importNode: Element, public parent: XMLSerializable) {
        this.modelDefinition = this;
        this.extensionElement = XML.getChildByTagName(this.importNode, EXTENSIONELEMENTS);
        this.name = this.parseAttribute('name');
        this.id = this.parseAttribute('id');
        this.parent = parent;
        this.childDefinitions = [];
        if (this.parent) {
            this.parent.childDefinitions.push(this);
        }
    }

    parseBooleanAttribute(name: string, defaultValue: boolean): boolean {
        const value = this.parseAttribute(name, defaultValue);
        if (typeof (value) == 'string') {
            if (value.toLowerCase() == 'false') return false;
            if (value.toLowerCase() == 'true') return true;
        }
        return defaultValue;
    }

    parseNumberAttribute(name: string, defaultValue: number): number {
        const value = this.parseAttribute(name, defaultValue);
        const number = parseInt(value);
        if (isNaN(number)) {
            return defaultValue;
        } else {
            return number;
        }
    }

    parseAttribute(name: string, defaultValue: any = undefined): string {
        if (this.importNode) {
            const value = this.importNode.getAttribute(name);
            if (value != null) {
                return value;
            }
        }
        return defaultValue;
    }

    parseCafienneAttribute(name: string, defaultValue: any = undefined): string {
        if (this.importNode) {
            const value = this.importNode.getAttributeNS(CAFIENNE_NAMESPACE, name);
            if (value != null) {
                return value;
            }
        }
        return defaultValue;
    }

    parseElementText(childName: string, defaultValue: string): string {
        const childElement = XML.getChildByTagName(this.importNode, childName);
        if (childElement) {
            return childElement.textContent || defaultValue;
        }
        return defaultValue;
    }

    parseElement(childName: string, constructor: Function): any {
        return this.instantiateChild(XML.getChildByTagName(this.importNode, childName), constructor);
    }

    parseElements(childName: string, constructor: Function, collection: any[] = [], node: Element = this.importNode): any[] {
        XML.getChildrenByTagName(node, childName).forEach(childNode => this.instantiateChild(childNode, constructor, collection));
        return collection;
    }

    parseExtension(constructor: Function, tagName: string): any {
        const node = XML.getChildByTagName(this.extensionElement, tagName);
        return this.createChild(node, constructor);
    }

    parseExtensions(constructor: Function, collection: any[] = [], tagName: string): any[] {
        XML.getChildrenByTagName(this.extensionElement, tagName).forEach(childNode => this.instantiateChild(childNode, constructor, collection));
        return collection;
    }

    parseImplementation(constructor: Function): any {
        return this.parseExtension(constructor, IMPLEMENTATION_TAG);
    }

    instantiateChild(childNode: Element, constructor: Function, collection: any = undefined): any {
        if (!childNode) {
            return undefined;
        }

        const newChild = this.createChild(childNode, constructor);
        if (collection) {
            if (collection.constructor.name == 'Array') {
                collection.push(newChild);
            } else {
                collection[newChild.id] = newChild;
            }
        }
        return newChild;
    }

    createChild(childNode: Element, constructor: XMLSerializable): any {
        // TODO TODO how to apply and new to constructor in TypeScript ???????????????????
        return new constructor(childNode, this.modelDefinition, this);
    }

    removeProperty(propertyName: string): void {
    }

    removeDefinitionReference(removedElement: XMLSerializable): void {
        for (const key in this) {
            const value: any = this[key];
            if (value === removedElement) {
                delete this[key];
            } else if (value instanceof Array) {
                const removed = Util.removeFromArray(value, removedElement);
            } else if (typeof (value) === 'string') {
                if (value && removedElement.id && value === removedElement.id) {
                    this.removeProperty(key);
                    delete this[key];
                }
            }
        }
    }

    exportProperties(...propertyNames: string[]): void {
        propertyNames.forEach(propertyName => {
            if (typeof (propertyName) == 'string') {
                this.exportProperty(propertyName, this[propertyName]);
            } else {
                if (propertyName.constructor.name == 'Array') {
                    propertyName.forEach(name => this.exportProperties(name));
                } else {
                    console.warn('Cannot recognize property name, because it is not of type string or array but ' + propertyName.constructor.name + '\n', propertyName);
                }
            }
        });
    }

    exportProperty(propertyName: string, propertyValue: any): void {
        if (propertyValue === undefined) return;
        if (propertyValue === '') return;
        if (propertyValue === null) return;
        if (propertyValue.constructor.name == 'Array') {
            propertyValue.forEach(singularPropertyValue => this.exportProperty(propertyName, singularPropertyValue));
        } else if (propertyValue instanceof ElementDefinition) {
            propertyValue.createExportNode(this.exportNode, propertyName);
        } else {
            if (typeof (propertyValue) == 'object') {
                console.warn('Writing property ' + propertyName + ' has a value of type object', propertyValue);
            }

            const stringifiedValue = propertyValue.toString()
            if (stringifiedValue) {
                this.exportNode.setAttribute(propertyName, propertyValue);
            }
        }
    }

    get exportNode() {
        if (!this._exportNode) {
            throw new Error("This code is invoked from the wrong place");
        } 
        return  this._exportNode;
    }

    createExportNode(parentNode: Node, tagName: string, ...propertyNames: string[]): void {
        this._exportNode = XML.createChildElement(parentNode, tagName);
        this.exportProperties(propertyNames);
    }

    createExtensionNode(parentNode: Node, tagName: string = IMPLEMENTATION_TAG, ...propertyNames: string[]): Node {
        this._exportNode = XML.createChildElement(this.getExtensionsElement(parentNode), tagName);
        const prefixAndLocalName = tagName.split(':');
        const prefix = `xmlns${prefixAndLocalName.length === 1 ? '' : ':' + prefixAndLocalName[0]}`;
        this.exportNode.setAttribute(prefix, CAFIENNE_NAMESPACE);
        this.exportProperties(propertyNames);
        return this.exportNode;
    }

    getExtensionsElement(parentNode: Node = this.exportNode): Element {
        let element = XML.getChildByTagName(parentNode, EXTENSIONELEMENTS);
        if (!element) {
            element = XML.createChildElement(parentNode, EXTENSIONELEMENTS);
            element.setAttribute('mustUnderstand', 'false');
        }
        return element;
    }

    createImplementationNode(): Node {
        return this.createExtensionNode(this.exportNode, IMPLEMENTATION_TAG);
    }

    resolveReferences(): void { }

    searchInboundReferences(): XMLSerializable[] {
        if (this.modelDefinition && this.modelDefinition.file) {
            const definitions = this.modelDefinition.file.repository.list.map(file => file.definition);
            const elements = definitions.map(definition => definition.elements).flat();
            const references = elements.filter(element => element.referencesElement(this));
            return references;
        }
        return [];
    }

    referencesElement(element: XMLSerializable): boolean {
        return false;
    }

    hasExternalReferences(): boolean {
        return false;
    }

    loadExternalReferences(callback: () => void): void {
        callback();
    }

    resolveExternalDefinition(fileName: string, callback: (definition: ModelDefinition | undefined) => void): void {
        console.groupCollapsed(`${this.constructor.name}${this.name ? '[' + this.name + ']' : ''} requires '${fileName}'`);

        this.modelDefinition.file.loadReference(fileName, file => {
            console.groupEnd();
            callback(file ? file.definition : undefined)
        });
    }

    flattenListToString(list: any[]): string {
        return list && list.length > 0 ? list.filter(item => item.id).map(item => item.id).join(' ') : undefined;
    }

    toString(): string {
        return this.constructor.name;
    }

    logDiff(): void {
        console.group('Import and export nodes for ' + this);
        console.log('Imported node: ' + XML.prettyPrint(this.importNode));
        console.log('Export node: ' + XML.prettyPrint(this.exportNode));
        console.groupEnd();
    }
}
