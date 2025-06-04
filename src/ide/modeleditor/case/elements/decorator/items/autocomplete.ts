import Images from "../../../../../util/images/images";
import StageView from "../../stageview";
import StageDecoratorBox from "../box/stagedecoratorbox";
import Decorator from "../decorator";

export default class AutoCompleteDecorator extends Decorator {
    /**
     * AutoCompleteDecorator for a stage
     */
    constructor(box: StageDecoratorBox, protected view: StageView) {
        super(box, view, Images.AutoComplete);
    }
    
    get tooltip() {
        const type = this.view.definition.toString().replace('Definition', '');
        return `${type} will complete when all active items have been completed and no required items are pending`;
    }

    get visibility() {
        return this.view.definition.autoComplete;
    }
}
