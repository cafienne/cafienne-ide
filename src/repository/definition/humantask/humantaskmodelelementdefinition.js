import ReferableElementDefinition from "../referableelementdefinition";
import HumanTaskModelDefinition from "./humantaskmodeldefinition";

export default class HumanTaskModelElementDefinition extends ReferableElementDefinition {
    /**
     * @param {Element} importNode 
     * @param {HumanTaskModelDefinition} modelDefinition
     * @param {HumanTaskModelElementDefinition} parent optional
     */
    constructor(importNode, modelDefinition, parent = undefined) {
        super(importNode, modelDefinition, parent);
    }
}
