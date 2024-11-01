import Edge from "@definition/dimensions/edge";
import CanvasElement from "./canvaselement";
import CaseView from "./caseview";
import CMMNElementView from "./cmmnelementview";
import { dia } from "jointjs";

export default class Connector extends CanvasElement {
    /**
     * 
     * @param {CaseView} cs 
     * @param {Edge} edge 
     */
    static createConnectorFromEdge(cs, edge) {
        const findItem = (cs, edge, propertyName) => {
            const id = edge[propertyName];
            const item = cs.getItem(id);
            if (item) return item;
        }

        const source = findItem(cs, edge, 'sourceId');
        const target = findItem(cs, edge, 'targetId');

        if (!source) {
            console.warn('Found illegal edge, without source ' + edge.sourceId, edge, target);
            return;
        }
        if (!target) {
            console.warn('Found illegal edge, without target ' + edge.targetId, edge, source);
            return;
        }
        return new Connector(cs, source, target, edge);
    }

    /**
     * Creates a connector object and an edge between the source and the target element.
     * @param {CMMNElementView} source 
     * @param {CMMNElementView} target 
     */
    static createConnector(source, target) {
        const edge = Edge.create(source, target);
        return new Connector(source.case, source, target, edge);
    }

    /**
     * Creates a connector (=link in jointJS) between a source and a target.
     * @param {CaseView} cs 
     * @param {CMMNElementView} source 
     * @param {CMMNElementView} target 
     * @param {Edge} edge 
     */
    constructor(cs, source, target, edge) {
        super(cs);
        this.source = source;
        this.target = target;
        this.edge = edge;
        this.criterion = source.isCriterion ? source : target.isCriterion ? target : undefined;

        const arrowStyle = this.criterion ? '8 3 3 3 3 3' : '5 5'

        this.link = this.xyz_joint = new dia.Link({
            source: { id: this.source.xyz_joint.id },
            target: { id: this.target.xyz_joint.id },
            attrs: {
                '.connection': { 'stroke-dasharray': arrowStyle }
            }
        });

        this.link.set('vertices', edge.vertices);
        this.__setJointLabel(edge.label);

        // Listen to the native joint event for removing, as removing a connector in the UI is initiated from joint.
        //  This opposed to how it is done in the other CMMNElements, there we have an explicit delete button ourselves.
        this.link.on('remove', cell => {
            // Remove connector from source and target, and also remove the edge from the dimensions through the case.
            source.__removeConnector(this);
            target.__removeConnector(this);
            this.case.__removeConnector(this);
            this.case.editor.completeUserAction(); // Save the case
        });

        this.link.on('change:vertices', e => {
            // Joint generates many change events, so we will not completeUserAction() each time,
            //  Instead, this is done when handlePointerUpPaper in case.js
            this.edge.vertices = e.changed.vertices;
        });

        // Render the connector in the case.
        this.case.__addConnector(this);
        // Inform both source and target about this new connector; just adds it to their connector collections.
        source.__addConnector(this);
        target.__addConnector(this);
        // Now inform source that it has connected to target
        source.__connectTo(target);
        // And inform target that source has connected to it
        target.__connectFrom(source);
    }

    __setJointLabel(text) {
        this.link.label(0, {
            attrs: {
                text: { text: text, 'font-size': 'smaller' }
            }
        });
    }

    /**
     * Set/get the label of the connector
     * @param {String} text
     */
    set label(text) {
        this.edge.label = text;
        this.__setJointLabel(text);
    }

    get label() {
        return this.edge.label;
    }

    // Connectors do not do things on move. That is handled by joint
    moved(x, y, newParent) {
    }

    mouseEnter() {
        // On mouse enter of a 'sentry' linked connector, we will show the standard event if it is not yet visible.
        //  It is hidden again on mouseout
        this.formerLabel = this.label;
        if (this.label || ! this.criterion) return;
        const onPart = this.criterion.__getOnPart(this);
        if (onPart) this.__setJointLabel(onPart.standardEvent);
    }

    mouseLeave() {
        this.__setJointLabel(this.formerLabel);
    }

    /**
     * Returns true if the connector is connected to a cmmn element with the specified id (either as source or target).
     * Note: this does not indicate whether it is connected at the source or the target end of the connector.
     * @param {String} id 
     * @returns {Boolean} Whether or not one of the sides of the connector is an element having the specified id.
     */
    hasElementWithId(id) {
        return this.source.id == id || this.target.id == id;
    }

    /**
     * Removes this connector
     */
    remove() {
        this.link.remove();
    }
}

export class TemporaryConnector extends CanvasElement {
    /**
     * Creates a temporary connector (=link in jointJS) from the source to a set of target coordinates
     * @param {CMMNElementView} source 
     * @param {*} coordinates 
     */
    constructor(source, coordinates) {
        super(source.case);
        this.source = source;
        this.link = this.xyz_joint = new dia.Link({
            source: { id: source.xyz_joint.id },
            target: coordinates,
            attrs: {
                '.connection': { 'stroke': 'blue' }
            }
        });
        source.case.graph.addCells([this.link]);
    }

    mouseEnter() {    }

    mouseLeave() {    }

    /**
     * Removes this temporary connector
     */
    remove() {
        this.link.remove();
    }

    /**
     * Changes the end point of the temporary connector. This is done typically on mouse move.
     */
    set target(coordinates) {
        this.link.set('target', coordinates);
    }
}
