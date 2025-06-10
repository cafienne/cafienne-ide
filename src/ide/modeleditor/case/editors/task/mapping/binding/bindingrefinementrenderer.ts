import $ from "jquery";
import TaskParameterDefinition from "../../../../../../../repository/definition/cmmn/caseplan/task/taskparameterdefinition";
import RowEditor from "../../../tableeditor/roweditor";
import BindingRefinementEditor from "./bindingrefinementeditor";

export default class BindingRefinementRenderer extends RowEditor<TaskParameterDefinition> {
    constructor(public editor: BindingRefinementEditor, parameter: TaskParameterDefinition) {
        super(editor, parameter);
        const parameterName = parameter ? parameter.name : '';
        const expression = parameter && parameter.bindingRefinement ? parameter.bindingRefinement.body : '';
        const bindingName = parameter ? parameter.bindingName : '';
        this.html = $(`<tr>
                            <td><div>${parameterName}</div></td>
                            <td><div><textarea>${expression}</textarea></div></td>
                            <td><div>${bindingName}</div></td>
                        </tr>`);
        const textarea = this.html.find('textarea');
        textarea.on('change', () => {
            parameter.bindingRefinementExpression = textarea.val() ?? '';
            this.case.editor.completeUserAction();
        })
    }

    get parameter() {
        // Just to have some typesafe reference
        return this.element;
    }

    /**
     * Refreshes the case file item label if we render it
      */
    refreshReferencingFields(cfi: TaskParameterDefinition) {
        if (!this.isEmpty() && this.parameter.bindingRef.references(cfi)) {
            this.html.find('.valuelabel').html(cfi.name);
        }
    }

    createElement(): TaskParameterDefinition {
        throw new Error('BindingRefinementRenderer does not create elements, it only renders existing ones.');
    }
}
