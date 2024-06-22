import CasePlanView from "../caseplanview";
import StageProperties from "./stageproperties";

export default class CasePlanProperties extends StageProperties {
    /**
     * @param {CasePlanView} casePlan 
     */
    constructor(casePlan) {
        super(casePlan);
        this.cmmnElement = /** @type {CasePlanView} */ (casePlan);
    }

    renderData() {
        // First couple of lines are actually CASE properties; for now we render these in the case plan properties view
        //  We also need lines to render the roles?
        this.addInputField('Case Name', 'name', this.cmmnElement.definition.caseDefinition);
        this.addTextField('Case Documentation', 'text', this.cmmnElement.definition.caseDefinition.documentation);
        this.addSeparator();
        this.addCaseRolesButton();
        this.addSeparator();
        this.addCaseParameters();
        this.addSeparator();
        this.addSeparator();
        this.addNameField();
        this.addSeparator();
        this.addDocumentationField();
        this.addSeparator();
        this.addAutoComplete();
        this.addPlanningTableField();
        this.addSeparator();
        this.addDefaultExpressionLanguage();
        this.addSeparator();
        this.addPlanItemTable();
        this.addIdField();
    }

    addCaseRolesButton() {
        const html = $(`<div title="Edit the case roles" class="propertyBlock">
                            <label>Case Team</label>
                            <div>
                                <img src="images/roles_128.png" />
                                <button class="btnCaseRolesEditor">Edit Roles</button>
                            </div>
                        </div>
                        <span class="separator" />
                        <div title="Edit the 'start case schema'" class="propertyBlock">
                            <label>Start Case Schema</label>
                            <div>
                                <img src="images/startcaseschema_128.png" />
                                <button class="btnCaseSchemaEditor">Edit Schema</button>
                            </div>
                        </div>`);
        html.find('.btnCaseRolesEditor').on('click', e => this.cmmnElement.case.rolesEditor.show());
        html.find('.btnCaseSchemaEditor').on('click', e => this.cmmnElement.case.startCaseEditor.show());
        this.htmlContainer.append(html);
        return html;
    }

    addCaseParameters() {
        const html = $(`<div title="Edit the case input and output parameters" class="propertyBlock">
                            <label>Case Parameters</label>
                            <div>
                                <img src="images/input_128.png" />
                                <button class="btnCaseParameters">Edit Parameters</button>
                                <img src="images/output_128.png" />
                            </div>
                        </div>`);
        html.find('.btnCaseParameters').on('click', e => this.cmmnElement.case.caseParametersEditor.show());
        this.htmlContainer.append(html);
        return html;
    }

    addDefaultExpressionLanguage() {
        const html = $(`<div title="Set the default language used in expressions across this case" class="propertyBlock ifPartLanguage">
                            <label>Default Expression Language</label>
                            <input class="default-language single" value="${this.cmmnElement.definition.caseDefinition.defaultExpressionLanguage}" type="text"></input>
                        </div>`);
        html.find('.default-language').on('change', e => {
            this.cmmnElement.definition.caseDefinition.defaultExpressionLanguage = e.target.value;
            this.done();
        });
        this.htmlContainer.append(html);
        return html;

    }
}
