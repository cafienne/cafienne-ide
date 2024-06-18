import XML from "../../../util/xml";
import CMMNElementDefinition from "../cmmnelementdefinition";
import CafienneImplementationDefinition from "../extensions/cafienneimplementationdefinition";
import ProcessModelDefinition from "./processmodeldefinition";

export default class ProcessImplementationDefinition extends CafienneImplementationDefinition {
    /**
    * @param {Element} importNode 
    * @param {ProcessModelDefinition} processDefinition
    * @param {CMMNElementDefinition} parent optional
    */
    constructor(importNode, processDefinition, parent = undefined) {
        super(importNode, processDefinition, parent);
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
