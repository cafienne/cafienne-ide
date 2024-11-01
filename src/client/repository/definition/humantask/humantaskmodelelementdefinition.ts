import DocumentableElementDefinition from "../documentableelementdefinition";
import HumanTaskModelDefinition from "./humantaskmodeldefinition";

export default class HumanTaskModelElementDefinition extends DocumentableElementDefinition<HumanTaskModelDefinition> {
    constructor(importNode: Element, modelDefinition: HumanTaskModelDefinition, parent?: HumanTaskModelElementDefinition) {
        super(importNode, modelDefinition, parent);
    }
}
