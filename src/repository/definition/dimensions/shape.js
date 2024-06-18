import Bounds from "./bounds";
import Diagram from "./diagram";
import DiagramElement from "./diagramelement";
import Dimensions from "./dimensions";
import Tags from "./tags";

export default class ShapeDefinition extends DiagramElement {
    /**
     * Representation of a <CMMNShape> element
     * 
     * @param {Element} importNode 
     * @param {Dimensions} dimensions 
     * @param {Diagram} parent
     */
    constructor(importNode, dimensions, parent) {
        super(importNode, dimensions, parent);
        this.diagram = parent;
        this.cmmnElementRef = this.parseAttribute(Tags.CMMNELEMENTREF);
        if (!this.cmmnElementRef) {
            this.dimensions.addParseWarning('Encountered a shape node in dimensions without a reference to a CMMN element');
        }
        this.bounds = this.parseElement(Tags.BOUNDS, Bounds);
        if (!this.bounds) {
            this.dimensions.addParseError('The Shape node for ' + this.cmmnElementRef + ' does not have a Bounds node; it cannot be used to draw element ' + this.cmmnElementRef);
        }
    }

    referencesElement(element) {
        return element.id === this.cmmnElementRef;
    }

    /**
     * @returns {Bounds}
     */
    get bounds() {
        if (!this._bounds) {
            this._bounds = new Bounds(undefined, this.dimensions, this);
        }
        return this._bounds;
    }

    set bounds(bounds) {
        this._bounds = bounds;
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

    createExportNode(diagramNode) {
        super.createExportNode(diagramNode, Tags.CMMNSHAPE, 'cmmnElementRef', 'bounds');
    }

    get hasError() {
        return this.bounds.hasError;
    }

    get errorText() {
        return this.bounds.errorText;
    }

    /**
     * Determines whether this shape surrounds the other shape
     * @param {ShapeDefinition} other 
     */
    surrounds(other) {
        return this != other && this.x <= other.x && this.y <= other.y && this.width + this.x >= other.width + other.x && this.height + this.y >= other.height + other.y;
    }

    get x() {
        return this.bounds.x;
    }

    set x(x) {
        this.bounds.x = x;
    }

    get y() {
        return this.bounds.y;
    }

    set y(y) {
        this.bounds.y = y;
    }

    get width() {
        return this.bounds.w;
    }

    set width(w) {
        this.bounds.w = w;
    }

    get height() {
        return this.bounds.h;
    }

    set height(h) {
        this.bounds.h = h;
    }

    toString() {
        return this.constructor.name + `[cmmnElementRef='${this.cmmnElementRef}', x=${this.x}, y=${this.y}, width=${this.width}, height=${this.height}]`;
    }
}

class CustomShape extends ShapeDefinition {
    constructor(importNode, dimensions, parent) {
        super(importNode, dimensions, parent);
        this.parentId = this.parseAttribute('parentId');
        if (!this.parentId) { // compatibility
            this.parentId = this.parseAttribute('parentid');
        }
    }

    migrate() {
        const shape = new ShapeDefinition(undefined, this.dimensions, this.diagram);
        shape.cmmnElementRef = this.cmmnElementRef;
        shape.x = this.x;
        shape.y = this.y;
        shape.width = this.width;
        shape.height = this.height;
        this.diagram.addShape(shape);
        return shape;
    }

    createExportNode() {
        // nothing to export no more
    }
}

export class CaseFileItemShape extends CustomShape {
    constructor(importNode, dimensions, parent) {
        super(importNode, dimensions, parent);
        this.contextRef = this.parseAttribute('contextRef');
    }

    migrate() {
        const shape = new ShapeDefinition(undefined, this.dimensions, this.diagram);
        shape.cmmnElementRef = this.contextRef;
        this.diagram.edges.forEach(edge => {
            if (edge.sourceId === this.cmmnElementRef) {
                edge.sourceId = this.contextRef;
            } else if (edge.targetId === this.cmmnElementRef) {
                edge.targetId = this.contextRef;
            }
        })
        shape.x = this.x;
        shape.y = this.y;
        shape.width = this.width;
        shape.height = this.height;
        this.diagram.addShape(shape);
        return shape;
    }
}

export class TextBoxShape extends CustomShape {
    constructor(importNode, dimensions, parent) {
        super(importNode, dimensions, parent);
        this.content = this.parseAttribute('content', '');
    }
}
