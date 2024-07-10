import XML from "@util/xml";
import ArtifactDefinition from "./artifactdefinition";
import CaseDefinition from "../cmmn/casedefinition";
import CMMNElementDefinition from "../cmmnelementdefinition";

export default class TextAnnotationDefinition extends ArtifactDefinition {
    textFormat: string;
    text: string;

    constructor(importNode: Element, caseDefinition: CaseDefinition, parent: CMMNElementDefinition) {
        super(importNode, caseDefinition, parent);
        this.textFormat = this.parseAttribute('textFormat');
        const textElement = XML.getChildByTagName(this.importNode, 'text');
        this.text = textElement ? XML.getCDATANodeOrSelf(textElement).textContent : '';
    }

    createExportNode(parentNode: Element): void {
        super.createExportNode(parentNode, 'textAnnotation', 'textFormat');

        const textElement = XML.createChildElement(this.exportNode, 'text');
        const textCDataNode = this.exportNode.ownerDocument.createCDATASection(this.text);
        textElement.appendChild(textCDataNode);
    }
}
