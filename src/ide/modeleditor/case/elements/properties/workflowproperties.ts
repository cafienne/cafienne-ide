import $ from "jquery";
import PlanItem from "../../../../../repository/definition/cmmn/caseplan/planitem";
import HumanTaskDefinition from "../../../../../repository/definition/cmmn/caseplan/task/humantaskdefinition";
import AssignmentDefinition from "../../../../../repository/definition/cmmn/caseplan/task/workflow/assignmentdefinition";
import DueDateDefinition from "../../../../../repository/definition/cmmn/caseplan/task/workflow/duedatedefinition";
import Util from "../../../../../util/util";
import HumanTaskView from "../humantaskview";
import TaskProperties from "./taskproperties";

export default class WorkflowProperties extends TaskProperties<HumanTaskView> {
    private humanTaskDefinition: HumanTaskDefinition;

    constructor(task: HumanTaskView) {
        super(task);
        this.humanTaskDefinition = this.view.definition;
    }

    get label() {
        return 'Workflow Properties';
    }

    refresh() {
        super.refresh();
    }

    addPerformerField() {
        const html = $(`<div class="szoomDoubleRow performer-field" title="Select a Case Role that is required to perform the task.\nWhen empty all case team members can perform the task.">
                            <label class="zoomlabel">Performer (role needed to do task)</label>
                            ${this.getRolesAsHTMLSelect(this.view.definition.performerRef, 'removeRoleButton')}
                        </div>`);
        html.find('select').on('change', (e: JQuery.ChangeEvent) => {
            this.change(this.view.definition, 'performerRef', (e.target as HTMLSelectElement).value);
        });
        html.find('.removeRoleButton').on('click', () => {
            this.change(this.view.definition, 'performerRef', '');
            html.find('select').val('');
        });
        this.htmlContainer.append(html);
        return html;
    }

    addAssignmentField() {
        const assignmentExpression = this.humanTaskDefinition.workflow.assignment;
        const ruleAvailable = !!assignmentExpression;
        const contextName = assignmentExpression ? assignmentExpression.contextRef.name : '';
        const expressionBody = assignmentExpression ? assignmentExpression.body : '';
        const assignmentPresenceIdentifier = Util.createID();
        const html = $(`<div class="propertyRule" title="Provide an expression that dynamically assigns the task to a user">
                            <div class="propertyRow">
                                <input id="${assignmentPresenceIdentifier}" type="checkbox" ${ruleAvailable ? 'checked' : ''}/>
                                <label for="${assignmentPresenceIdentifier}">Dynamic Assignment</label>
                            </div>
                            <div style="display:${ruleAvailable ? 'block' : 'none'}" class="ruleProperty">
                                <div class="propertyBlock">
                                    <label>Expression</label>
                                    <textarea class="multi">${expressionBody}</textarea>
                                </div>
                                <div class="zoomRow zoomDoubleRow">
                                    <label class="zoomlabel">Context for expression</label>
                                    <label class="valuelabel">${contextName}</label>
                                    <button class="zoombt"></button>
                                    <button class="removeReferenceButton" title="remove the reference to the case file item" />
                                </div>
                                <span class="separator" />
                            </div>
                        </div>`);
        html.find(`#${assignmentPresenceIdentifier}`).on('click', (e: JQuery.ClickEvent) => {
            const newPresence = (e.target as HTMLInputElement).checked;
            html.find('.ruleProperty').css('display', newPresence ? 'block' : 'none');
            if (!newPresence) {
                this.humanTaskDefinition.workflow.assignment = undefined;
            } else {
                this.humanTaskDefinition.workflow.assignment = <AssignmentDefinition> this.humanTaskDefinition.createDefinition(AssignmentDefinition);
            }
            this.done();
        });
        html.find('textarea').on('change', (e: JQuery.ChangeEvent) => this.change(this.humanTaskDefinition.workflow.assignment!, 'body', (e.target as HTMLTextAreaElement).value));
        html.find('.zoombt').on('click', () => this.view.case.cfiEditor.open(cfi => this.change(this.humanTaskDefinition.workflow.assignment!, 'contextRef', cfi.id)));
        html.find('.removeReferenceButton').on('click', () => this.change(this.humanTaskDefinition.workflow.assignment!, 'contextRef', undefined));
        html.find('.zoomRow').on('pointerover', (e: JQuery.Event) => {
            e.stopPropagation();
            this.view.case.cfiEditor.setDropHandler((dragData: any) => {
                const newContextRef = dragData.item.id;
                this.change(this.humanTaskDefinition.workflow.assignment!, 'contextRef', newContextRef);
            });
        });
        html.find('.zoomRow').on('pointerout', () => this.view.case.cfiEditor.removeDropHandler());
        this.htmlContainer.append(html);
        return html;
    }

    addDueDateField() {
        const dueDateExpression = this.humanTaskDefinition.workflow.dueDate;
        const ruleAvailable = !!dueDateExpression;
        const contextName = dueDateExpression ? dueDateExpression.contextRef.name : '';
        const expressionBody = dueDateExpression ? dueDateExpression.body : '';
        const dueDatePresenceIdentifier = Util.createID();
        const html = $(`<div class="propertyRule" title="Provide an expression returning a due date to set on the task">
                            <div class="propertyRow">
                                <input id="${dueDatePresenceIdentifier}" type="checkbox" ${ruleAvailable ? 'checked' : ''}/>
                                <label for="${dueDatePresenceIdentifier}">Due Date</label>
                            </div>
                            <div style="display:${ruleAvailable ? 'block' : 'none'}" class="ruleProperty">
                                <div class="propertyBlock">
                                    <label>Expression</label>
                                    <textarea class="multi">${expressionBody}</textarea>
                                </div>
                                <div class="zoomRow zoomDoubleRow">
                                    <label class="zoomlabel">Context for expression</label>
                                    <label class="valuelabel">${contextName}</label>
                                    <button class="zoombt"></button>
                                    <button class="removeReferenceButton" title="remove the reference to the case file item" />
                                </div>
                                <span class="separator" />
                            </div>
                        </div>`);
        html.find(`#${dueDatePresenceIdentifier}`).on('click', (e: JQuery.ClickEvent) => {
            const newPresence = (e.target as HTMLInputElement).checked;
            html.find('.ruleProperty').css('display', newPresence ? 'block' : 'none');
            if (!newPresence) {
                this.humanTaskDefinition.workflow.dueDate = undefined;
            } else {
                this.humanTaskDefinition.workflow.dueDate = this.humanTaskDefinition.createDefinition(DueDateDefinition);
            }
            this.done();
        });
        html.find('textarea').on('change', (e: JQuery.ChangeEvent) => this.change(this.humanTaskDefinition.workflow.dueDate!, 'body', (e.target as HTMLTextAreaElement).value));
        html.find('.zoombt').on('click', () => this.view.case.cfiEditor.open(cfi => this.change(this.humanTaskDefinition.workflow.dueDate!, 'contextRef', cfi.id)));
        html.find('.removeReferenceButton').on('click', () => this.change(this.humanTaskDefinition.workflow.dueDate!, 'contextRef', undefined));
        html.find('.zoomRow').on('pointerover', (e: JQuery.Event) => {
            e.stopPropagation();
            this.view.case.cfiEditor.setDropHandler((dragData: any) => {
                const newContextRef = dragData.item.id;
                this.change(this.humanTaskDefinition.workflow.dueDate!, 'contextRef', newContextRef);
            });
        });
        html.find('.zoomRow').on('pointerout', () => this.view.case.cfiEditor.removeDropHandler());
        this.htmlContainer.append(html);
        return html;
    }

    addFourEyesField() {
        const planItem = this.view.definition;
        const has4Eyes = planItem.fourEyes?.present;
        const checkboxIdentifier = Util.createID();
        const html = $(`<div class="propertyRule">
                            <div class="propertyRow">
                                <input id="${checkboxIdentifier}" type="checkbox" ${has4Eyes ? 'checked' : ''}/>
                                <label for="${checkboxIdentifier}">4-eyes</label>
                            </div>
                            <div style="display:${has4Eyes ? 'block' : 'none'}" title="Select ." class="list-human-tasks">
                            </div>
                        </div>`);
        const taskList = html.find('.list-human-tasks');
        const tasks = this.case.caseDefinition.getAllPlanItems().filter((item: any) => item instanceof HumanTaskDefinition);
        tasks.filter((task: any) => task !== planItem).forEach((task: any) => this.addTask(taskList, 'fourEyes', task));
        html.find(`#${checkboxIdentifier}`).on('click', (e: JQuery.ClickEvent) => {
            const newPresence = (e.target as HTMLInputElement).checked;
            html.find('.list-human-tasks').css('display', newPresence ? 'block' : 'none');
            if (!newPresence) {
                planItem.fourEyes?.drop();
            } else {
                planItem.fourEyes!.present = true;
            }
            this.done();
        });
        this.htmlContainer.append(html);
        return html;
    }

    addRendezVousField() {
        const planItem = this.view.definition;
        const hasRendezVous = planItem.rendezVous?.present;
        const checkboxIdentifier = Util.createID();
        const html = $(`<div class="propertyRule">
                            <div class="propertyRow">
                                <input id="${checkboxIdentifier}" type="checkbox" ${hasRendezVous ? 'checked' : ''}/>
                                <label for="${checkboxIdentifier}">Rendez-vous</label>
                            </div>
                            <div style="display:${hasRendezVous ? 'block' : 'none'}" title="Select ." class="list-human-tasks">
                            </div>
                        </div>`);
        const taskList = html.find('.list-human-tasks');
        const tasks = this.case.caseDefinition.getAllPlanItems().filter((item: any) => item instanceof HumanTaskDefinition);
        tasks.filter((task: any) => task !== planItem).forEach((task: any) => this.addTask(taskList, 'rendezVous', task));
        html.find(`#${checkboxIdentifier}`).on('click', (e: JQuery.ClickEvent) => {
            const newPresence = (e.target as HTMLInputElement).checked;
            html.find('.list-human-tasks').css('display', newPresence ? 'block' : 'none');
            if (!newPresence) {
                planItem.rendezVous?.drop();
            } else {
                planItem.rendezVous!.present = true;
            }
            this.done();
        });
        this.htmlContainer.append(html);
        return html;
    }

    done() {
        super.done();
        // Also refresh other workflow properties ...
        this.case.items
            .filter(item => item instanceof HumanTaskView)
            .forEach((item: HumanTaskView) => item.workflowProperties && item.workflowProperties.visible && item.workflowProperties.refresh());
    }

    addTask(htmlParent: JQuery<HTMLElement>, workflowProperty: string, task: PlanItem) {
        const planItem = this.view.definition;
        const isSelected = (planItem as any)[workflowProperty] && (planItem as any)[workflowProperty].has(task);
        const label = task.name;
        const checked = isSelected ? ' checked' : '';
        const checkboxIdentifier = Util.createID();
        const html = $(`<div class="propertyRule">
                            <div class="propertyRow">
                                <input id="${checkboxIdentifier}" type="checkbox" ${checked} />
                                <label for="${checkboxIdentifier}">${label}</label>
                            </div>
                        </div>`);
        html.on('change', (e: JQuery.ChangeEvent) => {
            if ((e.target as HTMLInputElement).checked) {
                (planItem as any)[workflowProperty].add(task);
            } else {
                (planItem as any)[workflowProperty].remove(task);
            }
            this.done();
        });
        htmlParent.append(html);
        return html;
    }

    renderData() {
        this.addLabelField('Workflow properties for', `'${this.view.name}'`);
        this.addSeparator();
        this.addPerformerField();
        this.addSeparator();
        this.addDueDateField();
        this.addSeparator();
        this.addAssignmentField();
        this.addSeparator();
        this.addFourEyesField();
        this.addSeparator();
        this.addRendezVousField();
        this.addIdField();
    }
}
