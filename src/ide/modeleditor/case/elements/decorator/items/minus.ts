import Images from "../../../../../util/images/images";
import StageView from "../../stageview";
import Decorator from "../decorator";
import DecoratorBox from "../decoratorbox";

export default class MinusDecorator extends Decorator {
    constructor(box: DecoratorBox, view: StageView) {
        super(box, view, Images.Minus);
    }

    get visibility() {
        return true;
    }
}
