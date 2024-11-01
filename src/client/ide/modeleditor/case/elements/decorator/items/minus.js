import Images from "@util/images/images";
import StageView from "../../stageview";
import Decorator from "../decorator";
import DecoratorBox from "../decoratorbox";

export default class MinusDecorator extends Decorator {
    /**
     * @param {DecoratorBox} box 
     * @param {StageView} view 
     */
    constructor(box, view) {
        super(box, view, Images.Minus);
    }

    get visibility() {
        return true;
    }
}
