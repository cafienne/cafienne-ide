import CasePlanView from "../../caseplanview";
import AutoCompleteDecorator from "../items/autocomplete";
import StageDecoratorBox from "./stagedecoratorbox";

export default class CasePlanDecoratorBox extends StageDecoratorBox {
    /**
     * @param {CasePlanView} view
     */
    constructor(view) {
        super(view);
        this.view = view;
        this.decorators = [
            new AutoCompleteDecorator(this, view)
        ];
    }
}
