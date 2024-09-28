import XMLSerializable from "../xmlserializable";
import Bounds from "./bounds";
import Diagram from "./diagram";
import DiagramElement from "./diagramelement";
import Dimensions from "./dimensions";
import Tags from "./tags";

export default class ShapeDefinition extends DiagramElement {
    cmmnElementRef: string;
    private bounds?: Bounds;
    /**
     * Representation of a <CMMNShape> element
     * 
     * @param {Element} importNode 
     * @param {Dimensions} dimensions 
     * @param {Diagram} diagram
     */
    constructor(importNode: Element, dimensions: Dimensions, public diagram: Diagram) {
        super(importNode, dimensions, diagram);
        this.cmmnElementRef = this.parseAttribute(Tags.CMMNELEMENTREF);
        if (!this.cmmnElementRef) {
            this.dimensions.addParseWarning('Encountered a shape node in dimensions without a reference to a CMMN element');
        }
        this.bounds = this.parseElement(Tags.BOUNDS, Bounds);
        if (!this.bounds) {
            this.dimensions.addParseError('The Shape node for ' + this.cmmnElementRef + ' does not have a Bounds node; it cannot be used to draw element ' + this.cmmnElementRef);
        }
    }

    referencesElement(element: XMLSerializable) {
        return element.id === this.cmmnElementRef;
    }

    /**
     * removeDefinition is an "override" implementation of CMMNElementDefinition.removeDefinition.
     * Within CMMNElementView, the __delete() method invokes this.definition.removeDefinition(), which in fact removes the CMMNElementDefinition
     * from the CaseDefinition. However, for TextAnnotation and CaseFileItem, this.definition refers to the custom shape, instead of to a CMMNElementDefinition.
     * Therefore we "override" this method here and update the internal registration.
     */
    removeShape() {
        // Remove the shape from the dimensions as well
        this.diagram.removeShape(this);
    }

    createExportNode(diagramNode: Element) {
        super.createExportNode(diagramNode, Tags.CMMNSHAPE, 'cmmnElementRef', 'bounds');
    }

    get hasError() {
        return this.bounds?.hasError;
    }

    get errorText() {
        return this.bounds?.errorText;
    }

    /**
     * Determines whether this shape surrounds the other shape
     * @param {ShapeDefinition} other 
     */
    surrounds(other: ShapeDefinition) {
        return this != other && this.bounds?.surrounds(other.bounds);
    }

    private getBounds() {
        if (!this.bounds) {
            this.bounds = new Bounds(this.importNode.ownerDocument.createElement(Tags.BOUNDS), this.dimensions, this);
        }
        return this.bounds;
    }

    get x() {
        return this.bounds?.x || -1;
    }

    set x(x) {
        this.getBounds().x = x;
    }

    get y() {
        return this.bounds?.y || -1;
    }

    set y(y) {
        this.getBounds().y = y;
    }

    get width() {
        return this.bounds?.w || -1;
    }

    set width(w) {
        this.getBounds().w = w;
    }

    get height() {
        return this.bounds?.h || -1;
    }

    set height(h) {
        this.getBounds().h = h;
    }

    toString() {
        return this.constructor.name + `[cmmnElementRef='${this.cmmnElementRef}', x=${this.x}, y=${this.y}, width=${this.width}, height=${this.height}]`;
    }
}
