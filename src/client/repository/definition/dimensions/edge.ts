import Util from "@util/util";
import Diagram from "./diagram";
import DiagramElement from "./diagramelement";
import Dimensions from "./dimensions";
import Tags from "./tags";
import Vertex from "./vertex";
import CMMNElementView from "@ide/modeleditor/case/elements/cmmnelementview";
import XMLSerializable from "../xmlserializable";
import XML from "@util/xml";
import ModelDefinition from "../modeldefinition";
import ElementDefinition from "../elementdefinition";

export default class Edge extends DiagramElement {
    private _vertices: Vertex[];
    sourceId: string;
    targetId: string;
    label: string | undefined;

    /**
     * Create a new Edge shape that binds the two CMMNElements.
     * @param {CMMNElementView} source 
     * @param {CMMNElementView} target
     * @returns {Edge}
     */
    static create(source: CMMNElementView, target: CMMNElementView) {
        if (! source.case.dimensions || ! source.case.diagram) {
            return undefined;
        }
        
        const edge = new Edge(XML.loadXMLString(`<${Tags.CMMNEDGE} />`).documentElement, source.case.dimensions, source.case.diagram);
        edge.sourceId = source.id;
        edge.targetId = target.id;
        source.case.diagram.edges.push(edge);
        return edge;
    }

    /**
     * Representation of a <CMMNEdge> element
     * @param {Element} importNode 
     * @param {Dimensions} dimensions 
     * @param {Diagram} diagram 
     */
    constructor(importNode: Element, dimensions: Dimensions, public diagram: Diagram) {
        super(importNode, dimensions, diagram);
        this.sourceId = this.parseAttribute(Tags.SOURCECMMNELEMENTREF);
        this.targetId = this.parseAttribute(Tags.TARGETCMMNELEMENTREF);
        /** @type {Array<Vertex>} */
        this._vertices = this.parseElements(Tags.WAYPOINT, Vertex);
        this.label = this.parseAttribute('label', '');
    }

    referencesElement(element: XMLSerializable) {
        return element.id === this.sourceId || element.id === this.targetId;
    }

    updateReferences<X extends ModelDefinition>(element: ElementDefinition<X>, oldId: string, newId: string, oldName: string, newName: string) {
        if (this.sourceId === oldId) {
            this.sourceId = newId;
        }
        if (this.targetId === oldId) {
            this.targetId = newId;
        }
    }

    get vertices() {
        return this._vertices;
    }

    set vertices(jointVertices) {
        this._vertices = jointVertices.map(v => Vertex.convert(this, v.x, v.y));
    }

    /**
     * Removes this edge from the dimensions.
     */
    removeDefinition() {
        Util.removeFromArray(this.diagram.edges, this);
    }

    createExportNode(diagramNode: Element) {
        super.createExportNode(diagramNode, Tags.CMMNEDGE, 'label', 'vertices');
        super.exportProperty(Tags.SOURCECMMNELEMENTREF, this.sourceId);
        super.exportProperty(Tags.TARGETCMMNELEMENTREF, this.targetId);
    }
}