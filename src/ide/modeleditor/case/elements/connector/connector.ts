import { dia } from "jointjs";
import Edge from "../../../../../repository/definition/dimensions/edge";
import CanvasElement from "../canvaselement";
import CMMNElementView from "../cmmnelementview";

export default class Connector extends CanvasElement<dia.Link> {
    criterion?: CMMNElementView;
    formerLabel?: string;

    get link(): dia.Link {
        return this.xyz_joint;
    }

    set link(link: dia.Link) {
        this.xyz_joint = link;
    }

    /**
     * Creates a connector (=link in jointJS) between a source and a target.
     */
    constructor(public source: CMMNElementView, public target: CMMNElementView, public edge: Edge) {
        super(source.case);
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
