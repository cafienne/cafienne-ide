import DocumentableElementDefinition from "../documentableelementdefinition";
import HumanTaskModelDefinition from "./humantaskmodeldefinition";

export default class HumanTaskModelElementDefinition extends DocumentableElementDefinition {
    /**
     * @param {Element} importNode 
     * @param {HumanTaskModelDefinition} modelDefinition
     * @param {HumanTaskModelElementDefinition} parent optional
     */
    constructor(importNode, modelDefinition, parent = undefined) {
        super(importNode, modelDefinition, parent);
    }
}
