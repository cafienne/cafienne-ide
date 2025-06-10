'use strict';

import TaskParameterDefinition from "../../../../../../../repository/definition/cmmn/caseplan/task/taskparameterdefinition";
import TaskView from "../../../../elements/taskview";
import RowEditor from "../../../tableeditor/roweditor";
import TableEditor from "../../../tableeditor/tableeditor";
import TableEditorColumn from "../../../tableeditor/tableeditorcolumn";
import MappingRow from "../mappingrow";
import BindingRefinementRenderer from "./bindingrefinementrenderer";

export default class BindingRefinementEditor extends TableEditor<TaskParameterDefinition> {
    taskParameter!: TaskParameterDefinition;
    task: TaskView
    /**
     * This editor enables manipulation of bindingRef and bindingRefinement of task parameters.
     * @param {MappingRow} mappingRow 
     */
    constructor(public mappingRow: MappingRow) {
        super(mappingRow.case);
        this.mappingRow = mappingRow;
        this.task = mappingRow.control.task;
        this.taskParameter = this.mappingRow.mapping.taskParameter!;
    }

    onHide() {
        this.mappingRow.control.refresh();
    }

    get label() {
        return `Edit the binding refinement of task parameter ${this.taskParameter.name} in task ${this.task.definition.name}`;
    }

    get columns() {
        if (this.mappingRow.mapping.isInputMapping) {
            return [
                new TableEditorColumn('Case File Item', '100px', 'Case File Item', ''),
                new TableEditorColumn('Binding Refinement', '460px', 'Binding Refinement', 'taskparameterbindingrefinementcol'),
                new TableEditorColumn('Task Parameter', '100px', 'Name of the task input parameter', 'taskparameternamecol')
            ];
        } else {
            return [
                new TableEditorColumn('Task Parameter', '100px', 'Name of the task output parameter', 'taskparameternamecol'),
                new TableEditorColumn('Binding Refinement', '460px', 'Binding Refinement', 'taskparameterbindingrefinementcol'),
                new TableEditorColumn('Case File Item', '100px', 'Case File Item', '')
            ];
        }
    }

    get data(): TaskParameterDefinition[] {
        // Mapping editor knows whether we need to have the input or output parameters
        return [this.taskParameter];
    }

    addRenderer(parameter?: TaskParameterDefinition): RowEditor<TaskParameterDefinition> | undefined {
        if (parameter != undefined) {
            return new BindingRefinementRenderer(this, parameter);
        }
    }

    refresh() {
        if (this._html) {
            this.renderForm();
        }
    }
}

