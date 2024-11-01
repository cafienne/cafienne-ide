import XML from "@util/xml";
import UnnamedCMMNElementDefinition from "../../unnamedcmmnelementdefinition";
import CaseDefinition from "../casedefinition";
import CMMNElementDefinition from "@repository/definition/cmmnelementdefinition";

export default class ExpressionDefinition extends UnnamedCMMNElementDefinition {
    body: string;
    private __language: string = '';
    constructor(importNode: Element, caseDefinition: CaseDefinition, parent: CMMNElementDefinition) {
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

    createExportNode(parentNode: Element, tagName: string) {
        super.createExportNode(parentNode, tagName);
        if (this.hasCustomLanguage) {
            this.exportProperties('language');
        }

        const bodyElement = XML.createChildElement(this.exportNode, 'body');
        const bodyCDataNode = this.exportNode.ownerDocument.createCDATASection(this.body);
        bodyElement.appendChild(bodyCDataNode);
        
    }
}
