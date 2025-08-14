import { dia } from '@joint/core';
import ModelCanvas from './modelcanvas';

export default abstract class CanvasElement<JointType extends dia.Cell = dia.Cell> {
    public case: ModelCanvas;
    private __jointElement?: JointType;

    constructor(cs: ModelCanvas) {
        this.case = cs;
    }

    set xyz_joint(jointElement: JointType) {
        this.__jointElement = jointElement;
        (<any>jointElement).xyz_cde = this;
    }

    get xyz_joint() {
        if (this.__jointElement) {
            return this.__jointElement;
        } else {
            throw new Error('Too early')
        }
    }

    /**
     * Hook invoked after the element has moved.
     * @param newParent - optional new parent 
     */
    moved(x: number, y: number, newParent: CanvasElement) {
    }

    /**
     * Hook invoked upon mouseEnter
     */
    mouseEnter() {
    }

    /**
     * Hook invoked upon mouseLeave
     */
    mouseLeave() { }
}
