import { dia } from '@joint/core';
import CaseView from "./caseview";

export default abstract class CanvasElement<JointType extends dia.Cell = dia.Cell> {
    public case: CaseView;
    private __jointElement?: JointType;

    constructor(cs: CaseView) {
        this.case = cs;
    }

    set xyz_joint(jointElement: JointType) {
        this.__jointElement = jointElement;
        (<any>jointElement).xyz_cmmn = this;
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
