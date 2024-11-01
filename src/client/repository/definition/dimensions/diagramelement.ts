import ElementDefinition from "../elementdefinition";
import Dimensions from "./dimensions";

export default class DiagramElement extends ElementDefinition<Dimensions> {
    /**
     * Creates a new ElementDefinition that belongs to the Definition object.
     * @param {Element} importNode 
     * @param {Dimensions} dimensions 
     * @param {ElementDefinition} parent 
     */
    constructor(importNode: Element, public dimensions: Dimensions, parent?: ElementDefinition<Dimensions>) {
        super(importNode, dimensions, parent);
    }
}
