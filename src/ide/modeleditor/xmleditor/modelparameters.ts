﻿'use strict';

import $ from "jquery";
import ParameterDefinition from "../../../repository/definition/contract/parameterdefinition";
import Util from "../../../util/util";
import HtmlUtil from "../../util/htmlutil";
import ModelEditor from "../modeleditor";

export default class ModelParameters {
    html: JQuery<HTMLElement>;
    parameters: ParameterDefinition[] = [];
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
                    <col class="modelparametertypecol"></col>
                    <col class="modelparameteridcol"></col>
                </colgroup>
                <thead>
                    <tr>
                        <th></th>
                        <th>Name</th>
                        <th>Type</th>
                        <th>ID</th>
                    </tr>
                </thead>
                <tbody></tbody>
            </table>
        </div>
    </div>`);

        this.htmlContainer.append(this.html);
    }

    renderParameters(parameters: ParameterDefinition[]) {
        // First clean the old content
        HtmlUtil.clearHTML(this.html.find('tbody'));

        // Overwrite current parameter set with the new array
        this.parameters = parameters;

        // Now render the parameters
        this.parameters.forEach(parameter => this.addParameter(parameter));
        this.addParameter();
    }

    changeParameter(html: JQuery<HTMLElement>, parameter: ParameterDefinition, name: string, id: string, typeRef: string = '') {
        if (parameter.isNew) {
            // No longer transient parameter
            parameter.isNew = false;
            this.parameters.push(parameter);
            this.addParameter();
        }
        parameter.name = name;
        parameter.typeRef = typeRef;
        parameter.id = id;
        if (!parameter.id) parameter.id = Util.createID('_', 4) + '_' + name.replace(/\s/g, '');
        if (!parameter.name) parameter.name = parameter.id;
        // Make sure a newly generated id is rendered as well.
        html.find('.inputParameterName').val(parameter.name);
        html.find('.inputParameterId').val(parameter.id);
        html.find('.inputParameterId').attr('readonly', 'true');
        this.editor.completeUserAction();
    }

    addParameter(parameter?: ParameterDefinition) {
        if (parameter === undefined) {
            // create a new, empty parameter at the end of the table
            parameter = this.editor.file?.definition?.createDefinition(ParameterDefinition);
            if (!parameter) return;
            parameter.id = parameter.name = '';
            parameter.isNew = true;
        }

        const typeSelector = () => this.editor.ide.repository.getTypes().map(type => `<option value="${type.fileName}" ${parameter.typeRef === type.fileName ? ' selected' : ''}>${type.name}</option>`).join('\n');

        const html = $(`<tr>
            <td><button class="removeParameter"></button></td>
            <td><input class="inputParameterName modelparameternamecol" value="${parameter.name}" /></td>
            <td><select class="inputParameterType modelparametertypecol"><option></option>${typeSelector()}</select></td>
            <td><input class="inputParameterId modelparameteridcol" readonly value="${parameter.id}" /></td>
        </tr>`);
        html.find('.removeParameter').on('click', e => {
            if (parameter.isNew) {
                return;
            }
            Util.removeFromArray(this.parameters, parameter);
            HtmlUtil.removeHTML(html);
            this.editor.completeUserAction();
        });

        html.find('.inputParameterName').on('change', e => this.changeParameter(html, parameter, (e.currentTarget as any).value, parameter.id));
        html.find('.inputParameterType').on('change', e => this.changeParameter(html, parameter, parameter.name || $(e.currentTarget).find(':selected').text(), parameter.id, (e.currentTarget as any).value));
        // // Remove "readonly" upon dblclick; id's are typically generated because they must be unique across multiple models
        html.find('.inputParameterId').on('dblclick', e => $(e.currentTarget).attr('readonly', <any>false));
        html.find('.inputParameterId').on('change', e => this.changeParameter(html, parameter, parameter.name, (e.currentTarget as any).value));
        this.html.find('tbody').append(html);
    }
}
