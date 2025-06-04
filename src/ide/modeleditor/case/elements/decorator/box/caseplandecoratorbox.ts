import CasePlanView from "../../caseplanview";
import AutoCompleteDecorator from "../items/autocomplete";
import StageDecoratorBox from "./stagedecoratorbox";

export default class CasePlanDecoratorBox extends StageDecoratorBox {
    constructor(view: CasePlanView) {
        super(view);
        this.decorators = [
            new AutoCompleteDecorator(this, view)
        ];
    }
}
