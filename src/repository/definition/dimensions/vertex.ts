import DiagramElement from "./diagramelement";
import Dimensions from "./dimensions";
import Edge from "./edge";
import Tags from "./tags";

export default class Vertex extends DiagramElement {
    /**
     * Returns a new Vertex object for the given Edge, containing the x and y in the v object as properties.
     * (They come as x,y props through the joint library)
     */
    static convert(edge: Edge, x: number, y: number) {
        return new Vertex(edge.importNode.ownerDocument.createElement(Tags.WAYPOINT), edge.dimensions, edge, x, y);
    }

    /**
     * Simple (x,y) wrapper indicating a point in a line.
     */
    constructor(importNode: Element, dimensions: Dimensions, parent: Edge, public x: number, public y: number) {
        super(importNode, dimensions, parent);
        this.x = this.parseNumberAttribute('x', x);
        this.y = this.parseNumberAttribute('y', y);
    }

    createExportNode(parentNode: Element) {
        super.createExportNode(parentNode, Tags.WAYPOINT, 'x', 'y');
    }
}
