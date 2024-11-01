import { dia } from "jointjs";
import CaseView from "./caseview";

export default class CanvasElement {
    public case: CaseView;
    private __jointElement?: dia.Element;

    constructor(cs: CaseView) {
        this.case = cs;
    }

    set xyz_joint(jointElement: dia.Element) {
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
    mouseLeave() {}
}
