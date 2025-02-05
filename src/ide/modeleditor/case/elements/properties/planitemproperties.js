import ConstraintDefinition from "../../../../../repository/definition/cmmn/caseplan/constraintdefinition";
import CaseRoleReference from "../../../../../repository/definition/cmmn/caseteam/caserolereference";
import { ReferenceSet } from "../../../../../repository/definition/references/referenceset";
import Images from "../../../../../util/images/images";
import Util from "../../../../../util/util";
import HtmlUtil from "../../../../../util/htmlutil";
import $ from "jquery";
import PlanItemView from "../planitemview";
import Properties from "./properties";

export default class PlanItemProperties extends Properties {
    /**
     * 
     * @param {PlanItemView} planItem 
     */
    constructor(planItem) {
        super(planItem);
        this.cmmnElement = planItem;
    }

    /**
     * Adds a block to render the item control rule with the specified name
     * @param {String} ruleName 
     * @param {String} imageURL 
     * @param {String} label1 
     * @param {String} label2 
     * @param {String} defaultValue 
     */
    addRuleBlock(ruleName, title, imageURL, label1, label2 = label1, defaultValue = 'true') {
        const element = this.cmmnElement.definition;
        const ruleAcronym = label1.split(' ').map(part => part.substring(0, 3)).join('. ');
        /** @type {ConstraintDefinition} */
        const rule = element.planItemControl ? element.planItemControl[ruleName] : undefined;
        const ruleAvailable = rule ? true : false;
        const contextName = rule ? rule.contextRef.name : '';
        const ruleBody = rule ? rule.body : defaultValue;
        const ruleLanguage = rule && rule.hasCustomLanguage ? rule.language : '';
        const nonDefaultLanguage = rule && rule.hasCustomLanguage ? ' custom-language' : '';
        const ruleLanguageTip = `Default language for expressions is '${this.cmmnElement.definition.caseDefinition.defaultExpressionLanguage}'. Click the button to change the language`;
        const ruleDeviatesTip = `Language used in this expression is '${ruleLanguage}'. Default language in the rest of the case model is '${this.cmmnElement.definition.caseDefinition.defaultExpressionLanguage}'`;
        const tip = rule && rule.hasCustomLanguage ? ruleDeviatesTip : ruleLanguageTip;
        const rulePresenceIdentifier = Util.createID();
        // const checked = ;
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
        html.find('.rulePresence').on('click', e => {
            const newPresence = e.target.checked;
            html.find('.ruleProperty').css('display', newPresence ? 'block' : 'none');
            if (!newPresence) {
                // Remove the rule from the definition...
                this.cmmnElement.definition.itemControl.removeRule(ruleName);
            } else {
                this.cmmnElement.definition.itemControl.getRule(ruleName).body = defaultValue;
            }
            this.done();
        });
        const htmlExpressionLanguage = html.find('.property-expression-language');
        const editHTMLExpressionLanguage = htmlExpressionLanguage.find('input');
        const showHTMLExpressionLanguage = htmlExpressionLanguage.find('button');
        editHTMLExpressionLanguage.on('change', e => {
            const rule = this.cmmnElement.definition.itemControl.getRule(ruleName);
            const newLanguage = e.target.value || this.cmmnElement.definition.caseDefinition.defaultExpressionLanguage;
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
        html.find('textarea').on('change', e => this.change(this.cmmnElement.definition.itemControl.getRule(ruleName), 'body', e.target.value));
        html.find('.zoombt').on('click', e => {
            this.cmmnElement.case.cfiEditor.open(cfi => {
                this.change(this.cmmnElement.definition.itemControl.getRule(ruleName), 'contextRef', cfi.id);
            });
        });
        html.find('.removeReferenceButton').on('click', e => {
            this.change(this.cmmnElement.definition.itemControl.getRule(ruleName), 'contextRef', undefined);
        });
        html.find('.zoomRow').on('pointerover', e => {
            e.stopPropagation();
            this.cmmnElement.case.cfiEditor.setDropHandler(dragData => {
                const newContextRef = dragData.item.id;
                this.change(this.cmmnElement.definition.itemControl.getRule(ruleName), 'contextRef', newContextRef);
            });
        });
        html.find('.zoomRow').on('pointerout', e => {
            this.cmmnElement.case.cfiEditor.removeDropHandler();
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
     * @param {String} currentRoleId 
     * @param {String} buttonClass
     */
    getRolesAsHTMLSelect(currentRoleId, buttonClass) {
        const existingRolesAsOptions = this.case.caseDefinition.caseTeam.roles.map(role => `<option value="${role.id}" ${role.id == currentRoleId ? ' selected' : ''}>${role.name}</option>`).join('');
        return `<div class="role-selector">
                    <span>
                        <select>
                            <option value="">select a role ...</option>
                            ${existingRolesAsOptions}
                        </select>
                    </span>
                    <button class="${buttonClass}"></button>
                </div>`;
    }

    addAuthorizatedRoles(parentHTML) {
        // Add a row for each role, and also an empty ro(w)le at the end to allow additional selections
        this.cmmnElement.definition.authorizedRoles.forEach(role => this.addAuthorizedRoleField(parentHTML, role));
        this.addAuthorizedRoleField(parentHTML);
    }

    /**
     * Adds a role. Can be undefined, in which case an empty row is added.
     * Also adds the required event handlers to the html.
     * @param {ReferenceSet<CaseRoleReference>} authorizedRoles 
     * @param {JQuery<HTMLElement>} parentHTML 
     * @param {CaseRoleReference} role 
     */
    addAuthorizedRoleField(parentHTML, role = undefined) {
        if (role && !role.name) {
            // We need not render empty roles, but it is actually pretty weird if it happens, so putting a warning log
            console.warn("Unexpected empty role name while rendering properties of " + this.cmmnElement.definition);
            return;
        }
        const authorizedRoles = this.cmmnElement.definition.authorizedRoleRefs;
        const roleId = role ? role.id : '';
        const html = $(this.getRolesAsHTMLSelect(role ? role.id : '', 'deleteRoleButton'));
        html.attr('id', roleId);
        html.find('select').on('change', e => {
            const newRoleId = $(e.target).val().toString();
            // console.log("Selected role with id "+newRoleId)
            // const roleAlreadyPresent = authorizedRoles.find(role => role.id == newRoleId)
            // if (roleAlreadyPresent) {
            //     // console.log("Not adding role, because it is already in the list")
            //     return;
            // }

            const currentRoleID = html.attr('id');
            const currentRoleReference = currentRoleID ? authorizedRoles.find(currentRoleID) : undefined;
            if (!currentRoleReference) {
                authorizedRoles.add(newRoleId);
                this.addAuthorizedRoleField(parentHTML); // Add a new role field
                console.groupEnd();
            } else {
                // this.change(currentRoleReference, 'role', newRole);
                currentRoleReference.update(newRoleId);
            }
            html.attr('id', newRoleId);
            this.done();
        });
        html.find('.deleteRoleButton').on('click', e => {
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
