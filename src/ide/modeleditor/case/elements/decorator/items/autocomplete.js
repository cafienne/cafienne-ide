import StageView from "../../stageview";
import StageDecoratorBox from "../box/stagedecoratorbox";
import Decorator from "../decorator";

export const AUTOCOMPLETE_IMG = 'images/autocompletedecorator_32.png';

export default class AutoCompleteDecorator extends Decorator {
    /**
     * @param {StageDecoratorBox} box 
     * @param {StageView} view 
     */
    constructor(box, view) {
        super(box, view, AUTOCOMPLETE_IMG);
        this.view = view;
    }
    
    get tooltip() {
        const type = this.view.planItemDefinition.toString().replace('Definition', '');
        return `${type} will complete when all active items have been completed and no required items are pending`
    }

    get visibility() {
        return this.view.planItemDefinition.autoComplete;
    }
}
