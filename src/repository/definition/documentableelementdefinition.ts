import XML, { Element } from "../../util/xml";
import CMMNDocumentationDefinition from "./cmmndocumentationdefinition";
import ElementDefinition from "./elementdefinition";
import ModelDefinition from "./modeldefinition";

export default class DocumentableElementDefinition<M extends ModelDefinition = ModelDefinition> extends ElementDefinition<M> {
    private __documentation?: CMMNDocumentationDefinition;
    /**
     * Creates an XML element that can be referred to by the value of the name or id attribute of the underlying XML element.
     * 
     */
    constructor(importNode: Element, modelDefinition: M, parent?: ElementDefinition<M>) {
        super(importNode, modelDefinition, parent);
        const documentationElement = XML.getChildByTagName(this.importNode, 'documentation');
        if (documentationElement) {
            this.__documentation = CMMNDocumentationDefinition.createDocumentationElement(documentationElement, this.modelDefinition, this);
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
            this.__documentation = CMMNDocumentationDefinition.createDocumentationElement(undefined, this.modelDefinition, this);
        }
        return this.__documentation;
    }

    createExportNode(parentNode: Element, tagName: string, ...propertyNames: any[]) {
        super.createExportNode(parentNode, tagName, 'documentation', propertyNames);
    }
}
