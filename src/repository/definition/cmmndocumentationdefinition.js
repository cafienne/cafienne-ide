import ModelDefinition from "./modeldefinition";
import ElementDefinition from "./elementdefinition";

export default class CMMNDocumentationDefinition extends ElementDefinition {
    /**
     * 
     * @param {Element} importNode 
     * @param {ModelDefinition} definition 
     */
    constructor(importNode, definition, parent) {
        super(importNode, definition, parent);
        this.textFormat = this.parseAttribute('textFormat', 'text/plain');
        const textElement = XML.getChildByTagName(this.importNode, 'text');
        this.text = textElement ? XML.getCDATANodeOrSelf(textElement).textContent : '';
    }

    createExportNode(parentNode, tagName) {
        if (!this.text) {
            return;
        }
        super.createExportNode(parentNode, tagName, 'textFormat');
        const textElement = XML.createChildElement(this.exportNode, 'text');
        const textCDataNode = this.exportNode.ownerDocument.createCDATASection(this.text);
        textElement.appendChild(textCDataNode);
    }
}
