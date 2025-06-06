import CaseFileItemDef from "../../../../../repository/definition/cmmn/casefile/casefileitemdef";
import CaseParameterDefinition from "../../../../../repository/definition/cmmn/contract/caseparameterdefinition";
import RowRenderer from "../tableeditor/rowrenderer";
import ParametersControl from "./parameterscontrol";


export default class ParameterRow extends RowRenderer<CaseParameterDefinition> {
    parameterName: string;
    expression: string;
    bindingName: string;

    constructor(control: ParametersControl, parameter?: CaseParameterDefinition) {
        super(control, parameter);
        this.parameterName = parameter?.name ?? '';
        this.expression = parameter
            ? parameter.bindingRefinement ? parameter.bindingRefinement.body : ''
            : '';
        this.bindingName = parameter?.bindingName ?? '';
    }


    get parameter() {
        // Just to have some typesafe reference
        return /** @type {CaseParameterDefinition} */ (this.element);
    }

    changeBindingRef(cfi: CaseFileItemDef) {
        if (!this.parameterName) {
            this.parameter.bindingRef.update(cfi.id);
            this.parameterName = this.parameter.name = this.parameter.bindingName;
        }
        this.change('bindingRef', cfi.id);
        this.html.find('.cfiName').html(this.parameter.bindingName);
        this.html.find('.parameter-name').val(this.parameter.name);
    }

    changeName(newName: string) {
        if (this.parameter.bindingRef.isEmpty) {
            // try to find a matching case file item
            const caseFileItem = this.parameter.caseDefinition.caseFile.getDescendants().find(child => child.name === newName);
            if (caseFileItem) {
                this.parameter.bindingRef.update(caseFileItem.id);
                this.html.find('.cfiName').html(this.parameter.bindingName);
            }
        }
        super.change('name', newName);
    }

    /**
     * Refreshes the case file item label if we render it
     */
    refreshReferencingFields(cfi: CaseParameterDefinition) {
        super.refreshReferencingFields(cfi);
        if (!this.isEmpty() && this.parameter.bindingRef.references(cfi)) {
            this.html.find('.cfiName').html(cfi.name);
        }
    }

    createElement(): CaseParameterDefinition {
        return this.control.editor.case!.caseDefinition.createDefinition(CaseParameterDefinition);
    }
}
