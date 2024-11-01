import ModelDefinition from "./modeldefinition";
import ElementDefinition from "./elementdefinition";
import XML from "@util/xml";

export default class CMMNDocumentationDefinition<M extends ModelDefinition> extends ElementDefinition<M> {
    textFormat: string;
    text: string;
    static createDocumentationElement<M extends ModelDefinition>(importNode: Element|undefined, modelDefinition: M, parent?: ElementDefinition<M>) {
        if (importNode === undefined) {
            importNode = modelDefinition.importNode.ownerDocument.createElement('documentation');
            if (parent && parent.importNode) {
                parent.importNode.appendChild(importNode);
            }
        }
        return new CMMNDocumentationDefinition(importNode, modelDefinition, parent);
    }

    /**
     * 
     * @param {Element} importNode 
     * @param {ModelDefinition} definition 
     */
    constructor(importNode: Element, definition: M, parent?: ElementDefinition<M>) {
        super(importNode, definition, parent);
        this.textFormat = this.parseAttribute('textFormat', 'text/plain');
        const textElement = XML.getChildByTagName(this.importNode, 'text');
        this.text = textElement ? XML.getCDATANodeOrSelf(textElement).textContent : '';
    }

    createExportNode(parentNode: Element, tagName: string) {
        if (!this.text) {
            return;
        }
        super.createExportNode(parentNode, tagName, 'textFormat');
        const textElement = XML.createChildElement(this.exportNode, 'text');
        const textCDataNode = this.exportNode.ownerDocument.createCDATASection(this.text);
        textElement.appendChild(textCDataNode);
    }
}
