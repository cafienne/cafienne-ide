import XML from "@util/xml";
import ElementDefinition from "../elementdefinition";
import CafienneImplementationDefinition from "../extensions/cafienneimplementationdefinition";
import ProcessModelDefinition from "./processmodeldefinition";

export default class ProcessImplementationDefinition extends CafienneImplementationDefinition<ProcessModelDefinition> {
    subProcessClassName: string;
    private _xml: string;
    /**
    * @param {Element} importNode 
    * @param {ProcessModelDefinition} processDefinition
    */
    constructor(importNode: Element, modelDefinition: ProcessModelDefinition, parent?: ElementDefinition<ProcessModelDefinition>) {
        super(importNode, modelDefinition, parent);
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
    createExportNode(parentNode: Element) {
        super.getExtensionsElement(parentNode).appendChild(XML.loadXMLString(this._xml).documentElement);
    }
}
