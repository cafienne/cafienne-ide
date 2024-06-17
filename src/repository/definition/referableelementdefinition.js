import XML from "../../util/xml";
import CMMNDocumentationDefinition from "./cmmndocumentationdefinition";
import ModelDefinition from "./modeldefinition";
import XMLElementDefinition from "./xmlelementdefinition";

export default class ReferableElementDefinition extends XMLElementDefinition {
    /**
     * Creates an XML element that can be referred to by the value of the name or id attribute of the underlying XML element.
     * 
     * @param {Element} importNode 
     * @param {ModelDefinition} modelDefinition 
     * @param {XMLElementDefinition} parent 
     */
    constructor(importNode, modelDefinition, parent) {
        super(importNode, modelDefinition, parent);
        // ModelDefinitions are also referable elements, but they need the constructor to complete first
        //  before we can parse the element properties. Hence they invoke below method themselves.
        if (modelDefinition !== undefined) {
            this.parseElementProperties();
        }
    }

    parseElementProperties() {
        this.id = this.parseAttribute('id');
        this.name = this.parseAttribute('name');
        this.parseDocumentationElement();
    }

    parseDocumentationElement() {
        const documentationElement = XML.getChildByTagName(this.importNode, 'documentation');
        if (documentationElement) {
            this.__documentation = new CMMNDocumentationDefinition(documentationElement, this.modelDefinition, this);
        }
        // Now check whether or not to convert the deprecated 'description' attribute
        const description = this.parseAttribute('description');
        if (description && !this.documentation.text) {
            this.modelDefinition.migrated(`Migrating CMMN1.0 description attribute to <cmmn:documentation> element in ${this.constructor.name} '${this.name}'`);
            this.documentation.text = description;
        }
    }

    /** @param {String} newId */
    set id(newId) {
        this.__id = newId;
    }

    get id() {
        return this.__id;
    }

    get name() {
        return this.__name;
    }

    /** @param {String} name */
    set name(name) {
        this.__name = name;
    }

    /**
     * @returns {CMMNDocumentationDefinition}
     */
    get documentation() {
        if (!this.__documentation) {
            this.__documentation = new CMMNDocumentationDefinition(undefined, this.modelDefinition, this);
        }
        return this.__documentation;
    }

    /**
     * Returns true if name or id property equals the identifier
     * @param {String} identifier 
     * @returns {Boolean}
     */
    hasIdentifier(identifier) {
        return this.id === identifier || this.name === identifier;
    }

    getIdentifier() {
        return this.id ? this.id : this.name ? this.name : '';
    }

    createExportNode(parentNode, tagName, ...propertyNames) {
        super.createExportNode(parentNode, tagName, 'id', 'name', 'documentation', propertyNames);
    }
}
