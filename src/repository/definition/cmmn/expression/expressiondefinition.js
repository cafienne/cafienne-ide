import XML from "@util/xml";
import UnnamedCMMNElementDefinition from "../../unnamedcmmnelementdefinition";

export default class ExpressionDefinition extends UnnamedCMMNElementDefinition {
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
        this.language = this.parseAttribute('language', '');
        const bodyElement = XML.getChildByTagName(this.importNode, 'body');
        this.body = bodyElement ? XML.getCDATANodeOrSelf(bodyElement).textContent : '';
    }

    set language(language) {
        this.__language = language;
    }

    get language() {
        return this.__language;
    }

    get hasCustomLanguage() {
        return this.language && this.language !== this.caseDefinition.defaultExpressionLanguage;
    }

    createExportNode(parentNode, tagName) {
        super.createExportNode(parentNode, tagName);
        if (this.hasCustomLanguage) {
            this.exportProperties('language');
        }

        const bodyElement = XML.createChildElement(this.exportNode, 'body');
        const bodyCDataNode = this.exportNode.ownerDocument.createCDATASection(this.body);
        bodyElement.appendChild(bodyCDataNode);
        
    }
}