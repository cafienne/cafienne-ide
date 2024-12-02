import ValidationContext from "@repository/validate/validation";
import ElementDefinition from "../elementdefinition";
import CMMNExtensionDefinition from "../extensions/cmmnextensiondefinition";
import CaseDefinition from "./casedefinition";

export default class StartCaseSchemaDefinition extends CMMNExtensionDefinition<CaseDefinition> {
    static TAG = 'cafienne:start-case-model';
    private _value: string | undefined | null;

    constructor(importNode: Element, caseDefinition: CaseDefinition, parent?: ElementDefinition<CaseDefinition>) {
        super(importNode, caseDefinition, parent);
        this.value = importNode ? importNode.textContent : '';
    }

    get value() {
        return this._value;
    }

    set value(value: string | undefined | null) {
        this._value = value;
    }

    createExportNode(parentNode: Element) {
        if (this.value?.trim()) {
            // Now dump start case schema if there is one. Should we also do ampersand replacements??? Not sure. Perhaps that belongs in business logic??
            // const startCaseSchemaValue = this.case.startCaseEditor.value.replace(/&/g, '&amp;');
            super.createExportNode(parentNode, StartCaseSchemaDefinition.TAG)
            this.exportNode.textContent = this.value;
        }
    }
    validate(validationContext: ValidationContext) {
        super.validate(validationContext);
        // no validations yet
    }
}
