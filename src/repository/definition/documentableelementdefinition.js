import XML from "@util/xml";
import CMMNDocumentationDefinition from "./cmmndocumentationdefinition";
import ModelDefinition from "./modeldefinition";
import ElementDefinition from "./elementdefinition";
import ReferableElementDefinition from "./referableelementdefinition";

export default class DocumentableElementDefinition extends ReferableElementDefinition {
    /**
     * Creates an XML element that can be referred to by the value of the name or id attribute of the underlying XML element.
     * 
     * @param {Element} importNode 
     * @param {ModelDefinition} modelDefinition 
     * @param {ElementDefinition} parent 
     */
    constructor(importNode, modelDefinition, parent) {
        super(importNode, modelDefinition, parent);
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

    /**
     * @returns {CMMNDocumentationDefinition}
     */
    get documentation() {
        if (!this.__documentation) {
            this.__documentation = new CMMNDocumentationDefinition(undefined, this.modelDefinition, this);
        }
        return this.__documentation;
    }

    createExportNode(parentNode, tagName, ...propertyNames) {
        super.createExportNode(parentNode, tagName, 'documentation', propertyNames);
    }
}