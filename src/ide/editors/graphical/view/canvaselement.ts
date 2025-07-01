import { dia } from "jointjs";
import ModelView from "./modelview";

export default abstract class CanvasElement<JointType extends dia.Cell, M extends ModelView<any, any, any>> {
    static fromJoint<E extends CanvasElement<any, any>>(model: dia.Cell): E {
        return (model as any).xyz_cmmn;
    }

    private __jointElement?: JointType;

    constructor(public modelView: M) {
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
    moved(x: number, y: number, newParent: CanvasElement<any, M>) {
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
