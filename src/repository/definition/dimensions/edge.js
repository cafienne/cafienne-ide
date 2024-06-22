import Util from "@util/util";
import Diagram from "./diagram";
import DiagramElement from "./diagramelement";
import Dimensions from "./dimensions";
import Tags from "./tags";
import Vertex from "./vertex";

export default class Edge extends DiagramElement {
    /**
     * Create a new Edge shape that binds the two CMMNElements.
     * @param {CMMNElementView} source 
     * @param {CMMNElementView} target
     * @returns {Edge}
     */
    static create(source, target) {
        const edge = new Edge(undefined, source.case.dimensions, source.case.diagram);
        edge.sourceId = source.id;
        edge.targetId = target.id;
        source.case.diagram.edges.push(edge);
        return edge;
    }

    /**
     * Representation of a <CMMNEdge> element
     * @param {Element} importNode 
     * @param {Dimensions} dimensions 
     * @param {Diagram} parent 
     */
    constructor(importNode, dimensions, parent) {
        super(importNode, dimensions, parent);
        this.diagram = parent;
        this.sourceId = this.parseAttribute(Tags.SOURCECMMNELEMENTREF);
        this.targetId = this.parseAttribute(Tags.TARGETCMMNELEMENTREF);
        /** @type {Array<Vertex>} */
        this._vertices = this.parseElements(Tags.WAYPOINT, Vertex);
        this.label = this.parseAttribute('label', '');
    }

    referencesElement(element) {
        return element.id === this.sourceId || element.id === this.targetId;
    }

    get vertices() {
        return this._vertices;
    }

    set vertices(vertices) {
        this._vertices = vertices.map(v => Vertex.convert(this, v));
    }

    /**
     * Removes this edge from the dimensions.
     */
    removeDefinition() {
        Util.removeFromArray(this.diagram.edges, this);
    }

    createExportNode(diagramNode) {
        super.createExportNode(diagramNode, Tags.CMMNEDGE, 'label', 'vertices');
        super.exportProperty(Tags.SOURCECMMNELEMENTREF, this.sourceId);
        super.exportProperty(Tags.TARGETCMMNELEMENTREF, this.targetId);
    }
}