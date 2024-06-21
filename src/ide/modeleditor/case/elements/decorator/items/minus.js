import StageView from "../../stageview";
import Decorator from "../decorator";
import DecoratorBox from "../decoratorbox";

const MINUS_IMG = 'images/minus_32.png';

export default class MinusDecorator extends Decorator {
    /**
     * @param {DecoratorBox} box 
     * @param {StageView} view 
     */
    constructor(box, view) {
        super(box, view, MINUS_IMG);
    }

    get visibility() {
        return true;
    }
}
