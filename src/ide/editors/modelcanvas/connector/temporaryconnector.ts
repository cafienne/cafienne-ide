import { shapes } from '@joint/core';
import CanvasElement from "../canvaselement";
import ElementView from '../elementview';
import Coordinates from "./coordinates";

export default class TemporaryConnector extends CanvasElement<shapes.standard.Link> {
    source: ElementView;
    link: shapes.standard.Link;

    /**
     * Creates a temporary connector (=link in jointJS) from the source to a set of target coordinates
     */
    constructor(source: ElementView, coordinates: Coordinates) {
        super(source.canvas);
        this.source = source;

        this.link = this.xyz_joint = new shapes.standard.Link({
            source: { id: this.source.xyz_joint.id },
            target: coordinates,
            attrs: {
                'line': {
                    'stroke': 'blue',
                    'stroke-dasharray': '1 1',
                    targetMarker: {
                        'type': 'rect',
                        'width': 0,
                        'height': 0,
                    }
                }
            },
        });
        this.link.addTo(this.canvas.graph);
    }

    mouseEnter(): void { }

    mouseLeave(): void { }

    /**
     * Removes this temporary connector
     */
    remove(): void {
        this.link.remove();
    }

    /**
     * Changes the end point of the temporary connector. This is done typically on mouse move.
     */
    set target(coordinates: Coordinates) {
        this.link.set('target', coordinates);
    }
}
