import ElementDefinition from "../elementdefinition";
import Dimensions from "./dimensions";

export default class DiagramElement extends ElementDefinition {
    /**
     * Creates a new ElementDefinition that belongs to the Definition object.
     * @param {Element} importNode 
     * @param {Dimensions} dimensions 
     * @param {ElementDefinition} parent 
     */
    constructor(importNode, dimensions, parent) {
        super(importNode, dimensions, parent);
        // Handy to keep track of dimensions object directly
        this.dimensions = dimensions;
    }
    
    writeAttribute(name, optionalValue) {
        if (optionalValue == undefined) {
            optionalValue = this[name];
        }

        if (optionalValue == undefined) return;
        if (optionalValue == null) return;
        if (typeof(optionalValue) != 'string') {
            optionalValue = optionalValue.toString();
        }
        if (optionalValue == '') return; // Empty strings will not be written.
        this.exportNode.setAttribute(name, optionalValue);
    }
}
