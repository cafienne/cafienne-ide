import { dia } from "jointjs";
import Edge from "../../../../repository/definition/dimensions/edge";
import CanvasElement from "../view/canvaselement";
import ElementView from "../view/elementview";
import ModelCanvas from "../view/modelcanvas";

export default abstract class Connector<V extends ElementView> extends CanvasElement<dia.Link, ModelCanvas> {
    formerLabel?: string;
    private _hiddenLabel?: string;

    /**
     * Creates a connector (=link in jointJS) between a source and a target.
     */
    constructor(cs: ModelCanvas<any, any>, public source: V, public target: V, public edge: Edge) {
        super(cs);

        this.xyz_joint = new dia.Link({
            source: { id: this.source.xyz_joint.id },
            target: { id: this.target.xyz_joint.id },
        });

        this.xyz_joint.set('vertices', this.edge.vertices);
        this.__setJointLabel(this.edge.label);

        // Listen to the native joint event for removing, as removing a connector in the UI is initiated from joint.
        this.xyz_joint.on('remove', () => {
            // Remove connector from source and target, and also remove the edge from the dimensions through the case.
            this.source.__removeConnector(this);
            this.target.__removeConnector(this);
            this.modelCanvas.__removeConnector(this);
            this.modelCanvas.completeUserAction(); // Save the case
        });

        this.xyz_joint.on('change:vertices', e => {
            // Joint generates many change events, so we will not completeUserAction() each time,
            // Instead, this is done when handlePointerUpPaper in case.js
            this.edge.vertices = e.changed.vertices;
        });

        // Render the connector in the case.
        this.modelCanvas.__addConnector(this);
        // Inform both source and target about this new connector; just adds it to their connector collections.
        this.source.__addConnector(this);
        this.target.__addConnector(this);
        // Now inform source that it has connected to target
        this.source.__connectTo(this.target);
        // And inform target that source has connected to it
        this.target.__connectFrom(this.source);
    }

    private __setJointLabel(text: string) {
        this.xyz_joint.label(0, {
            attrs: {
                text: { text, 'font-size': 'smaller' }
            }
        });
    }

    protected set connectionStyle(strokeDashArray: string) {
        this.xyz_joint.attr('.connection', {
            'stroke-dasharray': strokeDashArray
        });
    }

    /**
     * Set/get the label of the connector
     */
    set label(text: string) {
        this.edge.label = text;
        this.__setJointLabel(text);
    }

    set hiddenLabel(text: string) {
        this._hiddenLabel = text;
    }

    get label() {
        return this.edge.label || '';
    }

    mouseEnter(): void {
        // On mouse enter of a 'sentry' linked connector, we will show the standard event if it is not yet visible.
        //  It is hidden again on mouseout
        this.formerLabel = this.label;

        if (!this.label) {
            this.label = this._hiddenLabel || '';
        }
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
        this.xyz_joint.remove();
    }

    /**
     * Hook indicating that 'moving' completed.
     */
    moved(x: number, y: number, newParent: ElementView) {

    }
}
