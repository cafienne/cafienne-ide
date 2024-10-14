'use strict';

import ParameterDefinition from "@repository/definition/contract/parameterdefinition";
import ModelEditor from "../modeleditor";
import Util from "@util/util";
import $ from "jquery";
import ModelDefinition from "@repository/definition/modeldefinition";

export default class ModelParameters {
    html: JQuery<HTMLElement>;
    parameters: ParameterDefinition<ModelDefinition>[] = [];
    /**
     * This object handles the input and output parameters of task model editor.
     * 
     */
    constructor(public editor: ModelEditor, public htmlContainer: JQuery<HTMLElement>, public label: string) {
        this.html = $(
    `<div class='modelparametertable'>
        <label>${this.label}</label>
        <div>
            <table>
                <colgroup>
                    <col class="modelparameterdeletebtcol"></col>
                    <col class="modelparameternamecol"></col>
                    <col class="modelparameteridcol"></col>
                </colgroup>
                <thead>
                    <tr>
                        <th></th>
                        <th>Name</th>
                        <th>ID</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    </div>`);

        this.htmlContainer.append(this.html);
    }

    /**
     * 
     * @param {Array<ParameterDefinition>} parameters 
     */
    renderParameters(parameters: ParameterDefinition<ModelDefinition>[]) {
        // First clean the old content
        Util.clearHTML(this.html.find('tbody'));

        // Overwrite current parameter set with the new array
        this.parameters = parameters;

        // Now render the parameters
        this.parameters.forEach(parameter => this.addParameter(parameter));
        this.addParameter();
    }

    changeParameter(html: JQuery<HTMLElement>, parameter: ParameterDefinition<ModelDefinition>, name: string, id: string) {
        if (parameter.isNew) {
            // No longer transient parameter
            parameter.isNew = false;
            this.parameters.push(parameter);
            this.addParameter();
        }
        parameter.name = name;
        parameter.id = id;
        if (!parameter.id) parameter.id = Util.createID('_', 4) + '_' + name.replace(/\s/g, '');
        if (!parameter.name) parameter.name = parameter.id;
        // Make sure a newly generated id is rendered as well.
        html.find('.inputParameterName').val(parameter.name);
        html.find('.inputParameterId').val(parameter.id);
        html.find('.inputParameterId').attr('readonly', 'true');
        this.editor.completeUserAction();
    }

    /**
     * 
     * @param {ParameterDefinition} parameter 
     */
    addParameter(parameter?: ParameterDefinition<ModelDefinition>) {
        if (parameter === undefined) {
            // create a new, empty parameter at the end of the table
            parameter = this.editor.file?.definition?.createDefinition(ParameterDefinition);
            if (!parameter) return;
            parameter.id = parameter.name = '';
            parameter.isNew = true;
        }

        const html = $(`<tr>
            <td><button class="removeParameter"></button></td>
            <td><input class="inputParameterName modelparameternamecol" value="${parameter.name}" /></td>
            <td><input class="inputParameterId modelparameteridcol" readonly value="${parameter.id}" /></td>
        </tr>`);
        html.find('.removeParameter').on('click', e => {
            if (parameter.isNew) {
                return;
            }
            Util.removeFromArray(this.parameters, parameter);
            Util.removeHTML(html);
            this.editor.completeUserAction();
        });
        html.find('.inputParameterName').on('change', e => this.changeParameter(html, parameter, (e.currentTarget as any).value, parameter.id));
        // // Remove "readonly" upon dblclick; id's are typically generated because they must be unique across multiple models
        html.find('.inputParameterId').on('dblclick', e => $(e.currentTarget).attr('readonly', <any>false));
        html.find('.inputParameterId').on('change', e => this.changeParameter(html, parameter, parameter.name, (e.currentTarget as any).value));
        this.html.find('tbody').append(html);
    }
}
