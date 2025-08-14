import $ from "jquery";
import CaseFileItemTransition from "../../../../../repository/definition/cmmn/casefile/casefileitemtransition";
import CasePlanDefinition from "../../../../../repository/definition/cmmn/caseplan/caseplandefinition";
import PlanItem from "../../../../../repository/definition/cmmn/caseplan/planitem";
import PlanItemTransition from "../../../../../repository/definition/cmmn/caseplan/planitemtransition";
import { CaseFileItemStartTrigger, PlanItemStartTrigger } from "../../../../../repository/definition/cmmn/caseplan/timereventdefinition";
import TimerEventView from "../timereventview";
import PlanItemProperties from "./planitemproperties";

export default class TimerEventProperties extends PlanItemProperties<TimerEventView> {
    renderData() {
        this.addNameField();
        this.addSeparator();
        this.addDocumentationField();
        this.addSeparator();
        this.addTimerExpression();
        this.addSeparator();
        this.addRadioBlock();
        this.addIdField();
    }

    getPlanItemsSelect(trigger?: PlanItemStartTrigger) {
        const thisPlanItem = this.view.definition;
        const allPlanItems = this.view.definition.caseDefinition.elements.filter(e => (e instanceof CasePlanDefinition || e instanceof PlanItem) && e !== thisPlanItem);
        const planItemOptions = allPlanItems.map(item => {
            const selected = trigger && trigger.source === item ? ' selected="true"' : '';
            return `<option value="${item.id}" ${selected}>${item.name}</option>`;
        }).join('');
        return '<option></option>' + planItemOptions;
    }

    getPlanItemStandardEvents(trigger?: PlanItemStartTrigger) {
        if (!trigger || !trigger.source) {
            return '<option></option><option>first select a plan item</option>';
        } else {
            const isTransitionSelected = (transition: PlanItemTransition) => transition == trigger.standardEvent ? 'selected="true"' : '';
            return trigger.source.transitions.map(t => `<option value="${t}" ${isTransitionSelected(t)}>${t}</option>`).join('');
        }
    }

    getCaseFileItemStandardEvents(trigger?: CaseFileItemStartTrigger) {
        if (trigger && trigger.source) {
            const isTransitionSelected = (transition: CaseFileItemTransition) => transition == trigger.standardEvent ? 'selected="true"' : '';
            return CaseFileItemTransition.values.map(t => `<option value="${t}" ${isTransitionSelected(t)}>${t}</option>`).join('');
        } else {
            return '<option></option><option>first select a case file item item</option>';
        }
    }

    addRadioBlock() {
        const piTrigger = this.view.definition.planItemStartTrigger;
        const cfiTrigger = this.view.definition.caseFileItemStartTrigger;
        const piTriggerSelected = !!piTrigger;
        const planItemSelection = this.getPlanItemsSelect(piTrigger);
        const planItemTransitions = this.getPlanItemStandardEvents(piTrigger);
        const caseFileItemTransitions = this.getCaseFileItemStandardEvents(cfiTrigger);
        const caseFileItemName = cfiTrigger && cfiTrigger.source ? cfiTrigger.source.name : '';
        const html = $(`<label>Optional trigger for the timer event. A trigger is similar to an Entry Criterion.</label>
                        <span class="separator"></span>
                        <div class="propertyRow">
                            <input id="piRadio" type="radio" ${piTriggerSelected ? 'checked="true"' : ''} name="starttrigger2" />
                            <label for="piRadio">Plan Item transition</label>
                        </div>
                        <div class="propertyRow">
                            <input id="cfiRadio" type="radio" ${!piTriggerSelected ? 'checked="true"' : ''} name="starttrigger2" />
                            <label for="cfiRadio">Case File Item transition</label>
                        </div>
                        <div id="divPI" style="display:${piTriggerSelected ? 'block' : 'none'}">
                            <span class="separator" />
                            <div class="propertySelect">
                                <label>Plan Item</label>
                                <select id="selectPlanItem">${planItemSelection}</select>
                            </div>
                            <div class="propertySelect">
                                <label>Transition</label>
                                <select id="selectPlanItemTransition">${planItemTransitions}</select>
                            </div>
                        </div>
                        <div id="divCFI" style="display:${!piTriggerSelected ? 'block' : 'none'}">
                            <span class="separator" />
                            <div class="zoomRow zoomDoubleRow">
                                <label>Case File Item</label>
                                <label class="valuelabel">${caseFileItemName}</label>
                                <button class="zoombt"></button>
                                <button class="removeReferenceButton" title="remove the reference to the case file item" />
                            </div>
                            <div class="propertySelect">
                                <label>Transition</label>
                                <select id="selectCaseFileItemTransition">${caseFileItemTransitions}</select>
                            </div>
                        </div>`);
        html.find('#cfiRadio').on('change', (e: JQuery.ChangeEvent) => {
            if ((e.currentTarget as HTMLInputElement).checked) {
                this.view.definition.getCaseFileItemStartTrigger(); // Deletes pi trigger
                this.done();
                this.show();
            }
        });
        html.find('#piRadio').on('change', (e: JQuery.ChangeEvent) => {
            if ((e.currentTarget as HTMLInputElement).checked) {
                this.view.definition.getPlanItemStartTrigger(); // Deletes cfi trigger
                this.done();
                this.show();
            }
        });
        html.find('#selectPlanItem').on('change', (e: JQuery.ChangeEvent) => {
            const trigger = this.view.definition.getPlanItemStartTrigger();
            const selectedOption = (e.currentTarget as HTMLSelectElement).selectedOptions[0];
            const planItemID = selectedOption.value;
            trigger.sourceRef.update(planItemID);
            const planItem = this.view.definition.caseDefinition.getElement(planItemID);
            if (planItem && planItem instanceof PlanItem) {
                trigger.standardEvent = planItem.defaultTransition;
            }
            this.done();
            this.show();
        });
        html.find('#selectPlanItemTransition').on('change', (e: JQuery.ChangeEvent) => {
            const trigger = this.view.definition.getPlanItemStartTrigger();
            const selectedOption = (e.currentTarget as HTMLSelectElement).selectedOptions[0];
            const transition = selectedOption.value;
            this.change(trigger, 'standardEvent', transition);
            this.show();
        });
        html.find('.zoombt').on('click', () => {
            this.view.canvas.cfiEditor.open((cfi: any) => {
                const trigger = this.view.definition.getCaseFileItemStartTrigger();
                this.change(trigger, 'sourceRef', cfi.id);
                this.show();
            });
        });
        html.find('.removeReferenceButton').on('click', () => {
            const trigger = this.view.definition.getCaseFileItemStartTrigger();
            this.change(trigger, 'sourceRef', undefined);
            this.show();
        });
        html.find('.zoomRow').on('pointerover', (e: JQuery.Event) => {
            e.stopPropagation();
            this.view.canvas.cfiEditor.setDropHandler((dragData: any) => {
                const trigger = this.view.definition.getCaseFileItemStartTrigger();
                this.change(trigger, 'sourceRef', dragData.item.id);
                this.show();
            });
        });
        html.find('#selectCaseFileItemTransition').on('change', (e: JQuery.ChangeEvent) => {
            const trigger = this.view.definition.getCaseFileItemStartTrigger();
            const selectedOption = (e.currentTarget as HTMLSelectElement).selectedOptions[0];
            const transition = selectedOption.value;
            this.change(trigger, 'standardEvent', transition);
            this.show();
        });
        html.find('.zoomRow').on('pointerout', () => {
            this.view.canvas.cfiEditor.removeDropHandler();
        });
        this.htmlContainer.append(html);
    }

    addTimerExpression() {
        const ruleBody = this.view.definition.timerExpression ? this.view.definition.timerExpression.body : '';
        const html = $(`<div class="propertyBlock" title="Provide an expression that returns a duration.\nThis can be an expression returning a string that can be parsed to XSD duration format.\nIt can also be a reference to a property in the Case File that holds the duration">
                            <label>Timer Expression</label>
                            <textarea class="multi">${ruleBody}</textarea>
                        </div>`);
        html.find('textarea').on('change', (e: JQuery.ChangeEvent) => {
            this.change(this.view.definition.getTimerExpression(), 'body', (e.currentTarget as HTMLTextAreaElement).value);
        });
        this.htmlContainer.append(html);
    }
}
