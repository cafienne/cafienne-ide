import DiagramElement from "./diagramelement";
import Dimensions from "./dimensions";
import ShapeDefinition from "./shape";
import Tags from "./tags";

export default class Bounds extends DiagramElement {
    hasError = false;
    x: number;
    y: number;
    width: number;
    height: number;
    errorText?: string;
    /**
     * Indicates the bounds (x, y, width, height) of a shape.
     */
    constructor(importNode: Element, dimensions: Dimensions, public parent: ShapeDefinition) {
        super(importNode, dimensions, parent);
        this.x = this.parseIntAttribute('x', 0, 'coordinate');
        this.y = this.parseIntAttribute('y', 0, 'coordinate');
        this.width = this.parseIntAttribute('width', 0, 'attribute');
        this.height = this.parseIntAttribute('height', 0, 'attribute');
    }

    /**
     * Parses the attribute with the specified name from the node, and sets it in the bounds object.
     */
    parseIntAttribute(name: string, minValue: number, errorMsg: string): number {
        const attributeValue = this.parseNumberAttribute(name);
        if (! isNaN(attributeValue)) {
            return attributeValue;
        } else {
            this.error = 'The ' + name + ' ' + errorMsg + ' could not be found in the <Bounds> element of <CMMNShape cmmnElementRef="' + this.parent.cmmnElementRef + '"/>;'
            return -1;
        }
    }

    surrounds(other?: Bounds): boolean {
        if (! other) return true;
        return this.x <= other.x && this.y <= other.y && this.width + this.x >= other.width + other.x && this.height + this.y >= other.height + other.y
    }

    get w() {
        return this.width;
    }

    set w(newW) {
        this.width = newW;
    }

    get h() {
        return this.height;
    }

    set h(newH) {
        this.height = newH;
    }

    set error(msg: string) {
        this.errorText = msg;
        this.hasError = true;
    }

    createExportNode(diagramNode: Element) {
        super.createExportNode(diagramNode, Tags.BOUNDS, 'x', 'y', 'width', 'height');
    }
}
