import CMMNElementDefinition from "../cmmnelementdefinition";
import ConnectorStyle from "./connectorstyle";
import DiagramElement from "./diagramelement";
import Dimensions from "./dimensions";
import Edge from "./edge";
import ShapeDefinition, { CaseFileItemShape, TextBoxShape } from "./shape";
import Tags from "./tags";

export default class Diagram extends DiagramElement {
    /**
     * Representation of a <CMMNDiagram> element
     * 
     * @param {Element} importNode 
     * @param {Dimensions} dimensions 
     */
    constructor(importNode, dimensions) {
        super(importNode, dimensions, dimensions);

        /** @type {Array<ShapeDefinition>} */
        this.shapes = this.parseElements(Tags.CMMNSHAPE, ShapeDefinition);
        this.deprecatedTextBoxes = this.parseElements('textbox', TextBoxShape, []);
        this.deprecatedCaseFileItems = this.parseElements('casefileitem', CaseFileItemShape, []);
        /** @type {Array<Edge>} */
        this.edges = this.parseElements(Tags.CMMNEDGE, Edge);
        this.connectorStyle = new ConnectorStyle(this.parseCafienneAttribute('labels'));
    }

    createShape(x, y, width, height, cmmnElementRef = undefined) {
        const shape = new ShapeDefinition(undefined, this.dimensions, this);
        shape.cmmnElementRef = cmmnElementRef;
        shape.x = x;
        shape.y = y;
        shape.width = width;
        shape.height = height;
        this.addShape(shape);
        return shape;
    }

    /**
     * Returns the shape with the identifier or undefined.
     * @param {CMMNElementDefinition} definition
     * @returns {ShapeDefinition}
     */
    getShape(definition) {
        return this.shapes.find(shape => definition && shape.cmmnElementRef == definition.id);
    }

    /**
     * Adds a shape to the dimensions list.
     * @param {ShapeDefinition} shape 
     */
    addShape(shape) {
        this.shapes.push(shape);
    }

    /**
     * Removes the shape
     * @param {ShapeDefinition} shape 
     */
    removeShape(shape) {
        Util.removeFromArray(this.shapes, shape);
    }

    createExportNode(dimensionsNode) {
        super.createExportNode(dimensionsNode, Tags.CMMNDIAGRAM, 'shapes', 'edges');
        if (!this.connectorStyle.isDefault) {
            this.exportNode.setAttributeNS('org.cafienne', 'labels', this.connectorStyle.style);
        }
    }
}
