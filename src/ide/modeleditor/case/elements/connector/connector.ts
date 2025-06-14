import { dia } from "jointjs";
import Edge from "../../../../../repository/definition/dimensions/edge";
import CanvasElement from "../canvaselement";
import CaseView from "../caseview";
import CMMNElementView from "../cmmnelementview";

export default class Connector extends CanvasElement<dia.Link> {
    criterion?: CMMNElementView;
    formerLabel?: string;

    /**
     * Creates a connector from an edge definition.
     */
    static createConnectorFromEdge(cs: CaseView, edge: Edge): Connector | undefined {
        const findItem = (cs: CaseView, edge: Edge, propertyName: string): CMMNElementView | undefined => {
            const id = (edge as any)[propertyName];
            return cs.getItem(id);
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

    get link(): dia.Link {
        return this.xyz_joint;
    }

    set link(link: dia.Link) {
        this.xyz_joint = link;
    }

    /**
     * Creates a connector object and an edge between the source and the target element.
     */
    static createConnector(source: CMMNElementView, target: CMMNElementView): Connector {
        const edge = Edge.create(source.definition, target.definition);
        return new Connector(source.case, source, target, edge!);
    }

    /**
     * Creates a connector (=link in jointJS) between a source and a target.
     */
    constructor(cs: CaseView, public source: CMMNElementView, public target: CMMNElementView, public edge: Edge) {
        super(cs);
        this.criterion = source.isCriterion ? source : target.isCriterion ? target : undefined;

        const arrowStyle = this.criterion ? '8 3 3 3 3 3' : '5 5';

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
        this.link.on('remove', () => {
            // Remove connector from source and target, and also remove the edge from the dimensions through the case.
            source.__removeConnector(this);
            target.__removeConnector(this);
            this.case.__removeConnector(this);
            this.case.editor.completeUserAction(); // Save the case
        });

        this.link.on('change:vertices', e => {
            // Joint generates many change events, so we will not completeUserAction() each time,
            // Instead, this is done when handlePointerUpPaper in case.js
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

    private __setJointLabel(text: string) {
        this.link.label(0, {
            attrs: {
                text: { text, 'font-size': 'smaller' }
            }
        });
    }

    /**
     * Set/get the label of the connector
     */
    set label(text: string) {
        this.edge.label = text;
        this.__setJointLabel(text);
    }

    get label() {
        return this.edge.label || '';
    }

    // Connectors do not do things on move. That is handled by joint
    moved(x: number, y: number, newParent: any): void { }

    mouseEnter(): void {
        // On mouse enter of a 'sentry' linked connector, we will show the standard event if it is not yet visible.
        //  It is hidden again on mouseout
        this.formerLabel = this.label;
        if (this.label || !this.criterion) return;
        const onPart = (this.criterion as any).__getOnPart(this);
        if (onPart) this.__setJointLabel(onPart.standardEvent.toString());
    }

    mouseLeave() {
        this.__setJointLabel(this.formerLabel || "");
    }

    /**
     * Returns true if the connector is connected to a cmmn element with the specified id (either as source or target).
     * Note: this does not indicate whether it is connected at the source or the target end of the connector.
     */
    hasElementWithId(id: string) {
        return this.source.id == id || this.target.id == id;
    }

    /**
     * Removes this connector
     */
    remove() {
        this.link.remove();
    }
}
