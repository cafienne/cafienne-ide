import XML from "../../../util/xml";
import CaseDefinition from "../cmmn/definitions/casedefinition";
import CMMNElementDefinition from "../cmmn/definitions/cmmnelementdefinition";
import CafienneImplementationDefinition from "../cmmn/definitions/extensions/cafienneimplementationdefinition";

export default class ProcessImplementationDefinition extends CafienneImplementationDefinition {
    /**
    * @param {Element} importNode 
    * @param {CaseDefinition} caseDefinition
    * @param {CMMNElementDefinition} parent optional
    */
    constructor(importNode, caseDefinition, parent = undefined) {
        super(importNode, caseDefinition, parent);
        this.subProcessClassName = this.parseAttribute('class');
        this._xml = XML.prettyPrint(this.importNode);
    }

    get xml() {
        return this._xml;
    }

    set xml(xml) {
        this._xml = xml;
    }

    /**
     * 
     * @param {Element} parentNode 
     */
    createExportNode(parentNode) {
        super.getExtensionsElement(parentNode).appendChild(XML.loadXMLString(this._xml).documentElement);
    }
}
