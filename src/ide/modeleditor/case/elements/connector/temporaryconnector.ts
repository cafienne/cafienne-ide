import { dia } from "jointjs";
import CanvasElement from "../canvaselement";
import CMMNElementView from "../cmmnelementview";
import Coordinates from "./coordinates";

export default class TemporaryConnector extends CanvasElement<dia.Link> {
    source: CMMNElementView;
    link: dia.Link;

    /**
     * Creates a temporary connector (=link in jointJS) from the source to a set of target coordinates
     */
    constructor(source: CMMNElementView, coordinates: Coordinates) {
        super(source.case);
        this.source = source;
        this.link = this.xyz_joint = new dia.Link({
            source: { id: source.xyz_joint.id },
            target: coordinates,
            attrs: {
                '.connection': { 'stroke': 'blue' }
            }
        });
        source.case.graph!.addCells([this.link]);
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
