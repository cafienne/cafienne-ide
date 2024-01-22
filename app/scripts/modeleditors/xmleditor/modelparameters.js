'use strict';

class ModelParameters {
    /**
     * This object handles the input and output parameters of task model editor.
     * 
     * @param {ModelEditor} editor 
     * @param {JQuery<HTMLElement>} htmlContainer 
     * @param {String} label 
     */
    constructor(editor, htmlContainer, label) {
        this.editor = editor;
        this.htmlContainer = htmlContainer;
        this.label = label;
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

    /**
     * 
     * @param {Array<ImplementationParameterDefinition>} parameters 
     */
    renderParameters(parameters) {
        // First clean the old content
        Util.clearHTML(this.html.find('tbody'));

        // Overwrite current parameter set with the new array
        this.parameters = parameters;

        // Now render the parameters
        this.parameters.forEach(parameter => this.addParameter(parameter));
        this.addParameter();
    }

    changeParameter(html, parameter, name, id, type) {
        if (parameter.isNew) {
            // No longer transient parameter
            parameter.isNew = false;
            this.parameters.push(parameter);
            this.addParameter();
        }
        parameter.name = name;
        parameter.id = id;
        parameter.type = type;
        if (! parameter.id) parameter.id = Util.createID('_', 4) + '_' + name.replace(/\s/g, '');
        if (! parameter.name) parameter.name = parameter.id;
        // Make sure a newly generated id is rendered as well.
        html.find('.inputParameterName').val(parameter.name);
        html.find('.inputParameterType').val(parameter.type);
        html.find('.inputParameterId').val(parameter.id);
        html.find('.inputParameterId').attr('readonly', 'true');
        this.editor.completeUserAction();
    }

    /**
     * 
     * @param {ImplementationParameterDefinition} parameter 
     */
    addParameter(parameter = undefined) {
        if (parameter === undefined) {
            // create a new, empty parameter at the end of the table
            parameter = this.editor.model.createDefinition(ImplementationParameterDefinition);
            parameter.id = parameter.name = '';
            parameter.isNew = true;
        }

        const html = $(`<tr>
            <td><button class="removeParameter"></button></td>
            <td><input class="inputParameterName modelparameternamecol" value="${parameter.name}" /></td>
            <td><select class="inputParameterType modelparametertypecol">${this.getOptionTypeHTML()}</select></td>
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
        html.find('.inputParameterName').on('change', e => this.changeParameter(html, parameter, e.currentTarget.value, parameter.id, parameter.type));
        html.find('.inputParameterType').on('change', e => this.changeParameter(html, parameter, parameter.name, parameter.id, e.currentTarget.value));
        html.find('.inputParameterType').val(parameter.type);
        // Remove "readonly" upon dblclick; id's are typically generated because they must be unique across multiple models
        html.find('.inputParameterId').on('dblclick', e => $(e.currentTarget).attr('readonly', false));
        html.find('.inputParameterId').on('change', e => this.changeParameter(html, parameter, parameter.name, e.currentTarget.value, parameter.type));

        this.html.find('tbody').append(html);
    }

    /**
     * return a string that defines the <option>'s for the type select
     * The select has an empty option and the already available type's
     * @returns {String}
     */
    getOptionTypeHTML() {
        // First create 1 options for "empty" then add all type files
        return (
            ['<option value=""></option>']
                .concat(this.editor.ide.repository.getTypes().map(type => `<option value="${type.fileName}">${type.name}</option>`))
                .join(''));
    };

}
