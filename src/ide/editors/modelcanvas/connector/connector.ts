import { dia, linkTools, shapes } from '@joint/core';
import Edge from "../../../../repository/definition/dimensions/edge";
import Images from '../../../util/images/images';
import CanvasElement from "../canvaselement";
import ElementView from '../elementview';


export default class Connector<BaseViewT extends ElementView = ElementView> extends CanvasElement<dia.Link> {
    formerLabel?: string;
    private _hiddenLabel?: string;

    get link(): shapes.standard.Link {
        return this.xyz_joint;
    }

    set link(link: shapes.standard.Link) {
        this.xyz_joint = link;
    }

    /**
     * Creates a connector (=link in jointJS) between a source and a target.
     */
    constructor(public source: BaseViewT, public target: BaseViewT, public edge: Edge) {
        super(source.case);

        this.link = this.xyz_joint = new shapes.standard.Link({
            source: { id: this.source.xyz_joint.id },
            target: { id: this.target.xyz_joint.id },
            attrs: {
                'line': {
                    stroke: '#423d3d',
                    'stroke-width': 1,
                    targetMarker: {
                        'type': 'rect',
                        'width': 0,
                        'height': 0,
                    }
                }
            },
        });

        this.link.vertices(edge.vertices);
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
            // Instead, this is done when handlePointerUpPaper in modelcanvas.ts
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

    protected set connectionStyle(strokeDashArray: string) {
        this.xyz_joint.attr('line', {
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

    get label() {
        return this.edge.label || '';
    }

    set hiddenLabel(text: string) {
        this._hiddenLabel = text;
    }

    // Connectors do not do things on move. That is handled by joint
    moved(x: number, y: number, newParent: ElementView): void { }

    mouseEnter(): void {
        this.addTools();

        this.link.attr('line/stroke', 'blue');

        if (!this.label) {
            this.label = this._hiddenLabel || '';
        }
    }

    mouseLeave() {
        this.removeTools();

        this.link.attr('line/stroke', '#423d3d');

        this.__setJointLabel(this.formerLabel || "");
    }

    addTools() {
        // Create a custom remove tool
        const customRemoveTool = new linkTools.Remove({
            markup: [{
                tagName: 'image',
                selector: 'remove',
                attributes: {
                    'xlink:href': Images.DeleteBig,
                    width: 14,
                    height: 14,
                    x: -7,
                    y: -7,
                    cursor: 'pointer'
                }
            }]
        });

        const toolsView = new dia.ToolsView({
            tools: [new linkTools.Vertices(), customRemoveTool]
        });
        const view = this.link.findView(this.case.paper);
        view.addTools(toolsView);
    }

    private removeTools() {
        const view = this.link.findView(this.case.paper);
        view.removeTools();
    }

    /**
     * Returns true if the connector is connected to an element with the specified id (either as source or target).
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
