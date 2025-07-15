import $ from "jquery";
import ItemControlRuleDefinition from "../../../../../repository/definition/cmmn/caseplan/itemcontrol/itemcontrolruledefinition";
import CaseRoleReference from "../../../../../repository/definition/cmmn/caseteam/caserolereference";
import Util from "../../../../../util/util";
import HtmlUtil from "../../../../util/htmlutil";
import Images from "../../../../util/images/images";
import PlanItemView from "../planitemview";
import Properties from "./properties";

export default class PlanItemProperties<PIV extends PlanItemView = PlanItemView> extends Properties<PIV> {

    /**
     * Adds a block to render the item control rule with the specified name
     */
    addRuleBlock(ruleName: string, title: string, imageURL: string, label1: string, label2: string = label1, defaultValue: string = 'true') {
        const element = this.view.definition;
        const ruleAcronym = label1.split(' ').map(part => part.substring(0, 3)).join('. ');
        const rule: ItemControlRuleDefinition | undefined = element.planItemControl ? (element.planItemControl as any)[ruleName] : undefined;
        const ruleAvailable = !!rule;
        const contextName = rule ? rule.contextRef.name : '';
        const ruleBody = rule ? rule.body : defaultValue;
        const ruleLanguage = rule && rule.hasCustomLanguage ? rule.language : '';
        const nonDefaultLanguage = rule && rule.hasCustomLanguage ? ' custom-language' : '';
        const ruleLanguageTip = `Default language for expressions is '${this.view.definition.caseDefinition.defaultExpressionLanguage}'. Click the button to change the language`;
        const ruleDeviatesTip = `Language used in this expression is '${ruleLanguage}'. Default language in the rest of the case model is '${this.view.definition.caseDefinition.defaultExpressionLanguage}'`;
        const tip = rule && rule.hasCustomLanguage ? ruleDeviatesTip : ruleLanguageTip;
        const rulePresenceIdentifier = Util.createID();

        const html = $(`<div class="propertyRule" title="${title}">
                            <div class="propertyRow">
                                <input id="${rulePresenceIdentifier}" class="rulePresence" type="checkbox" ${ruleAvailable ? 'checked' : ''}/>
                                <img src="${imageURL}" />
                                <label for="${rulePresenceIdentifier}">${label1}</label>
                            </div>
                            <div style="display:${ruleAvailable ? 'block' : 'none'}" class="ruleProperty">
                                <div class="propertyBlock">
                                    <label>${label2} Rule</label>
                                    <span class="property-expression-language ${nonDefaultLanguage}" title="${tip}">
                                        <button>L</button>
                                        <input class="input-expression-language" value="${ruleLanguage}" />
                                    </span>
                                    <textarea class="multi">${ruleBody}</textarea>                                    
                                </div>
                                <div class="zoomRow zoomDoubleRow">
                                    <label class="zoomlabel">${ruleAcronym}. Rule Context</label>
                                    <label class="valuelabel">${contextName}</label>
                                    <button class="zoombt"></button>
                                    <button class="removeReferenceButton" title="remove the reference to the case file item" />
                                </div>
                                <span class="separator" />
                            </div>
                        </div>`);
        html.find('.rulePresence').on('click', (e: any) => {
            const newPresence = e.target.checked;
            html.find('.ruleProperty').css('display', newPresence ? 'block' : 'none');
            if (!newPresence) {
                this.view.definition.itemControl.removeRule(ruleName);
            } else {
                this.view.definition.itemControl.getRule(ruleName).body = defaultValue;
            }
            this.done();
        });
        const htmlExpressionLanguage = html.find('.property-expression-language');
        const editHTMLExpressionLanguage = htmlExpressionLanguage.find('input');
        const showHTMLExpressionLanguage = htmlExpressionLanguage.find('button');
        editHTMLExpressionLanguage.on('change', e => {
            const rule = this.view.definition.itemControl.getRule(ruleName);
            const newLanguage = e.target.value || this.view.definition.caseDefinition.defaultExpressionLanguage;
            this.change(rule, 'language', newLanguage);
            if (rule.hasCustomLanguage) {
                HtmlUtil.addClassOverride(htmlExpressionLanguage, 'custom-language');
            } else {
                HtmlUtil.removeClassOverride(htmlExpressionLanguage, 'custom-language');
            }
            this.done();
        });
        showHTMLExpressionLanguage.on('click', () => {
            if (editHTMLExpressionLanguage.css('display') === 'none') {
                editHTMLExpressionLanguage.css('display', 'block');
                HtmlUtil.addClassOverride(htmlExpressionLanguage, 'show-language-input');
            } else {
                editHTMLExpressionLanguage.css('display', 'none');
                HtmlUtil.removeClassOverride(htmlExpressionLanguage, 'show-language-input');
            }
        });
        html.find('textarea').on('change', e => this.change(this.view.definition.itemControl.getRule(ruleName), 'body', e.target.value));
        html.find('.zoombt').on('click', () => {
            this.view.case.cfiEditor.open((cfi: any) => {
                this.change(this.view.definition.itemControl.getRule(ruleName), 'contextRef', cfi.id);
            });
        });
        html.find('.removeReferenceButton').on('click', () => {
            this.change(this.view.definition.itemControl.getRule(ruleName), 'contextRef', undefined);
        });
        html.find('.zoomRow').on('pointerover', e => {
            e.stopPropagation();
            this.view.case.cfiEditor.setDropHandler((dragData: any) => {
                const newContextRef = dragData.item.id;
                this.change(this.view.definition.itemControl.getRule(ruleName), 'contextRef', newContextRef);
            });
        });
        html.find('.zoomRow').on('pointerout', () => {
            this.view.case.cfiEditor.removeDropHandler();
        });
        this.htmlContainer.append(html);
        return html;
    }

    addRepeatRuleBlock() {
        this.addRuleBlock('repetitionRule', 'Provide a condition under which the item repeats.\nBy default items do not repeat.', Images.Repetition, 'Repeat', 'Repetition');
    }

    addRequiredRuleBlock() {
        this.addRuleBlock('requiredRule', 'Provide an expression determining whether or not the item is required.\nIf an item is required, the parent stage will not complete if the item is not completed.', Images.Required, 'Required');
    }

    addManualActivationRuleBlock() {
        this.addRuleBlock('manualActivationRule', Images.ManualActivation, '', 'Manual Activation', 'Manual Activation', 'false');
    }

    /**
     * Returns a HTML string with a select that has all case roles in it.
     * Sets the role with currentRoleId as selected if it is set.
     */
    getRolesAsHTMLSelect(selectedRole: CaseRoleReference | undefined, buttonClass: string) {
        const isSelected = (caseRole: any) => selectedRole !== undefined && selectedRole.value === caseRole.id;
        const existingRolesAsOptions = this.case.caseDefinition.caseTeam.roles.map((role: any) =>
            `<option style="color:green" value="${role.id}" ${isSelected(role) ? ' selected' : ''}>${role.name}</option>`
        ).join('');
        const invalidRoleOption = selectedRole && selectedRole.nonEmpty && (!selectedRole.getDefinition() || !this.case.caseDefinition.caseTeam.hasRole(selectedRole.getDefinition()!))
            ? `<option style="color:red" value="${selectedRole.value}" selected>${selectedRole.name ?? selectedRole.value}</option>`
            : '';
        return `<div class="role-selector">
                    <span>
                        <select ${invalidRoleOption ? ' title="Invalid role reference" style="color:red"' : ''}>
                            <option style="color:black" value="">select a role ...</option>
                            ${existingRolesAsOptions}
                            ${invalidRoleOption}
                        </select>
                    </span>
                    <button class="${buttonClass}"></button>
                </div>`;
    }

    addAuthorizatedRoles(parentHTML: JQuery<HTMLElement>) {
        // Add a row for each role, and also an empty role at the end to allow additional selections
        this.view.definition.authorizedRoles.forEach((role: CaseRoleReference) => this.addAuthorizedRoleField(parentHTML, role));
        this.addAuthorizedRoleField(parentHTML);
    }

    /**
     * Adds a role. Can be undefined, in which case an empty row is added.
     * Also adds the required event handlers to the html.
     */
    addAuthorizedRoleField(parentHTML: JQuery<HTMLElement>, role: CaseRoleReference | undefined = undefined) {
        const authorizedRoles = this.view.definition.authorizedRoleRefs;
        const roleId = role ? role.value : '';
        const html = $(this.getRolesAsHTMLSelect(role, 'deleteRoleButton'));
        html.attr('id', roleId);
        html.find('select').on('change', (e: any) => {
            const newRoleId = $(e.target).val().toString();
            const currentRoleID = html.attr('id');
            const currentRoleReference = currentRoleID ? authorizedRoles.find(currentRoleID) : undefined;
            if (!currentRoleReference) {
                authorizedRoles.add(newRoleId);
                this.addAuthorizedRoleField(parentHTML); // Add a new role field
                console.groupEnd();
            } else {
                currentRoleReference.update(newRoleId);
            }
            html.attr('id', newRoleId);
            this.done();
        });
        html.find('.deleteRoleButton').on('click', () => {
            const currentRoleID = html.attr('id');
            if (currentRoleID) {
                authorizedRoles.remove(currentRoleID);
                HtmlUtil.removeHTML(html);
                this.done();
            }
        });
        parentHTML.append(html);
        return html;
    }
}
