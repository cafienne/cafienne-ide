import XML from "@util/xml";
import ArtifactDefinition from "./artifactdefinition";

export default class TextAnnotationDefinition extends ArtifactDefinition {
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
        this.textFormat = this.parseAttribute('textFormat');
        const textElement = XML.getChildByTagName(this.importNode, 'text');
        this.text = textElement ? XML.getCDATANodeOrSelf(textElement).textContent : '';
    }

    createExportNode(parentNode) {
        super.createExportNode(parentNode, 'textAnnotation', 'textFormat');

        const textElement = XML.createChildElement(this.exportNode, 'text');
        const textCDataNode = this.exportNode.ownerDocument.createCDATASection(this.text);
        textElement.appendChild(textCDataNode);
    }
}
