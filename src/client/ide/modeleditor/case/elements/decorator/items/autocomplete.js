import Images from "@util/images/images";
import StageView from "../../stageview";
import StageDecoratorBox from "../box/stagedecoratorbox";
import Decorator from "../decorator";

export default class AutoCompleteDecorator extends Decorator {
    /**
     * @param {StageDecoratorBox} box 
     * @param {StageView} view 
     */
    constructor(box, view) {
        super(box, view, Images.AutoComplete);
        this.view = view;
    }
    
    get tooltip() {
        const type = this.view.definition.toString().replace('Definition', '');
        return `${type} will complete when all active items have been completed and no required items are pending`
    }

    get visibility() {
        return this.view.definition.autoComplete;
    }
}
