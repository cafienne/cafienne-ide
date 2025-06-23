import Util from "../../../util/util";
import { Element } from "../../../util/xml";
import CMMNElementDefinition from "../cmmnelementdefinition";
import Tags from "../tags";
import ConnectorStyle from "./connectorstyle";
import DiagramElement from "./diagramelement";
import Dimensions from "./dimensions";
import Edge from "./edge";
import ShapeDefinition from "./shape";

export default class Diagram extends DiagramElement {
    shapes: ShapeDefinition[];
    edges: Edge[];
    connectorStyle: ConnectorStyle;
    /**
     * Representation of a <CMMNDiagram> element
     */
    constructor(importNode: Element, public dimensions: Dimensions) {
        super(importNode, dimensions, undefined);

        this.shapes = this.parseElements(Tags.CMMNSHAPE, ShapeDefinition);
        this.edges = this.parseElements(Tags.CMMNEDGE, Edge);
        this.connectorStyle = new ConnectorStyle(this.parseCafienneAttribute('labels'));
    }

    createShape(x: number, y: number, width: number, height: number, cmmnElementRef: string) {
        const shape = new ShapeDefinition(this.createImportNode(Tags.CMMNSHAPE), this.dimensions, this);
        shape.cmmnElementRef = cmmnElementRef;
        shape.x = x;
        shape.y = y;
        shape.width = width;
        shape.height = height;
        this.addShape(shape);
        return shape;
    }

    createEdge(source: CMMNElementDefinition, target: CMMNElementDefinition) {
        const edge = new Edge(source.createImportNode(Tags.CMMNEDGE), this.dimensions, this);
        edge.sourceId = source.id;
        edge.targetId = target.id;
        this.edges.push(edge);
        return edge;
    }

    /**
     * Returns the shape with the identifier or undefined.
     */
    getShape(definition: CMMNElementDefinition): ShapeDefinition | undefined {
        return this.shapes.find(shape => definition && shape.cmmnElementRef == definition.id);
    }

    /**
     * Adds a shape to the dimensions list.
     */
    addShape(shape: ShapeDefinition) {
        this.shapes.push(shape);
    }

    /**
     * Removes the shape
     */
    removeShape(shape: ShapeDefinition) {
        Util.removeFromArray(this.shapes, shape);
    }

    createExportNode(dimensionsNode: Element) {
        super.createExportNode(dimensionsNode, Tags.CMMNDIAGRAM, 'shapes', 'edges');
        if (!this.connectorStyle.isDefault) {
            this.exportNode.setAttributeNS('org.cafienne', 'labels', this.connectorStyle.style);
        }
    }
}
