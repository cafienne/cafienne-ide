import { dia, shapes } from "jointjs";
import CanvasElement from "../view/canvaselement";
import ModelView from "../view/modelview";
import Coordinates from "./coordinates";

export default class TemporaryConnector<M extends ModelView> extends CanvasElement<dia.Link, ModelView> {
    source: CanvasElement<shapes.basic.Generic, M>;
    link: dia.Link;

    /**
     * Creates a temporary connector (=link in jointJS) from the source to a set of target coordinates
     */
    constructor(source: CanvasElement<shapes.basic.Generic, M>, coordinates: Coordinates) {
        super(source.modelView);
        this.source = source;
        this.link = this.xyz_joint = new dia.Link({
            source: { id: source.xyz_joint.id },
            target: coordinates,
            attrs: {
                '.connection': { 'stroke': 'blue' }
            }
        });
        source.modelView.graph!.addCells([this.link]);
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
