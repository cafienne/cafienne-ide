import PlanItem from "@repository/definition/cmmn/caseplan/planitem";
import AssignmentDefinition from "@repository/definition/cmmn/caseplan/task/workflow/assignmentdefinition";
import DueDateDefinition from "@repository/definition/cmmn/caseplan/task/workflow/duedatedefinition";
import Util from "@util/util";
import HumanTaskDefinition from "../../../../../repository/definition/cmmn/caseplan/task/humantaskdefinition";
import HumanTaskView from "../humantaskview";
import TaskProperties from "./taskproperties";

export default class WorkflowProperties extends TaskProperties {
    /**
     * 
     * @param {HumanTaskView} task 
     */
    constructor(task) {
        super(task);
        this.cmmnElement = task;
        /** @type {HumanTaskDefinition} */
        this.humanTaskDefinition = this.cmmnElement.definition.definition;
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
                            ${this.getRolesAsHTMLSelect(this.cmmnElement.planItemDefinition.performerRef, 'removeRoleButton')}
                        </div>`);
        html.find('select').on('change', e => {
            this.change(this.cmmnElement.planItemDefinition, 'performerRef', e.target.value);
        });
        html.find('.removeRoleButton').on('click', e => {
            this.change(this.cmmnElement.planItemDefinition, 'performerRef', undefined);
            html.find('select').val(undefined);
        });
        this.htmlContainer.append(html);
        return html;
    }

    /**
     * Adds a block to render the Assignee of the task
     */
    addAssignmentField() {
        const assignmentExpression = this.humanTaskDefinition.assignment;
        const ruleAvailable = assignmentExpression ? true : false;
        const contextRef = assignmentExpression ? assignmentExpression.contextRef : '';
        const contextName = contextRef ? this.cmmnElement.definition.caseDefinition.getElement(contextRef).name : '';
        const expressionBody = assignmentExpression ? assignmentExpression.body : '';
        const assignmentPresenceIdentifier = Util.createID();
        // const checked = ;
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
        html.find(`#${assignmentPresenceIdentifier}`).on('click', e => {
            const newPresence = e.target.checked;
            html.find('.ruleProperty').css('display', newPresence ? 'block' : 'none');
            if (!newPresence) {
                this.humanTaskDefinition.assignment = undefined;
            } else {
                this.humanTaskDefinition.assignment = this.humanTaskDefinition.createDefinition(AssignmentDefinition);
            }
            this.done();
        });
        html.find('textarea').on('change', e => this.change(this.humanTaskDefinition.assignment, 'body', e.target.value));
        html.find('.zoombt').on('click', e => {
            this.cmmnElement.case.cfiEditor.open(cfi => {
                this.change(this.humanTaskDefinition.assignment, 'contextRef', cfi.id);
            });
        });
        html.find('.removeReferenceButton').on('click', e => {
            this.change(this.humanTaskDefinition.assignment, 'contextRef', undefined);
        });
        html.find('.zoomRow').on('pointerover', e => {
            e.stopPropagation();
            this.cmmnElement.case.cfiEditor.setDropHandler(dragData => {
                const newContextRef = dragData.item.id;
                this.change(this.humanTaskDefinition.assignment, 'contextRef', newContextRef);
            });
        });
        html.find('.zoomRow').on('pointerout', e => {
            this.cmmnElement.case.cfiEditor.removeDropHandler();
        });
        this.htmlContainer.append(html);
        return html;
    }

    /**
     * Adds a block to render the Assignee of the task
     */
    addDueDateField() {
        const dueDateExpression = this.humanTaskDefinition.dueDate;
        const ruleAvailable = dueDateExpression ? true : false;
        const contextRef = dueDateExpression ? dueDateExpression.contextRef : '';
        const contextName = contextRef ? this.cmmnElement.definition.caseDefinition.getElement(contextRef).name : '';
        const expressionBody = dueDateExpression ? dueDateExpression.body : '';
        const assignmentPresenceIdentifier = Util.createID();
        // const checked = ;
        const html = $(`<div class="propertyRule" title="Provide an expression returning a due date to set on the task">
                            <div class="propertyRow">
                                <input id="${assignmentPresenceIdentifier}" type="checkbox" ${ruleAvailable ? 'checked' : ''}/>
                                <label for="${assignmentPresenceIdentifier}">Due Date</label>
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
        html.find(`#${assignmentPresenceIdentifier}`).on('click', e => {
            const newPresence = e.target.checked;
            html.find('.ruleProperty').css('display', newPresence ? 'block' : 'none');
            if (!newPresence) {
                this.humanTaskDefinition.dueDate = undefined;
            } else {
                this.humanTaskDefinition.dueDate = this.humanTaskDefinition.createDefinition(DueDateDefinition);
            }
            this.done();
        });
        html.find('textarea').on('change', e => this.change(this.humanTaskDefinition.dueDate, 'body', e.target.value));
        html.find('.zoombt').on('click', e => {
            this.cmmnElement.case.cfiEditor.open(cfi => {
                this.change(this.humanTaskDefinition.dueDate, 'contextRef', cfi.id);
            });
        });
        html.find('.removeReferenceButton').on('click', e => {
            this.change(this.humanTaskDefinition.dueDate, 'contextRef', undefined);
        });
        html.find('.zoomRow').on('pointerover', e => {
            e.stopPropagation();
            this.cmmnElement.case.cfiEditor.setDropHandler(dragData => {
                const newContextRef = dragData.item.id;
                this.change(this.humanTaskDefinition.dueDate, 'contextRef', newContextRef);
            });
        });
        html.find('.zoomRow').on('pointerout', e => {
            this.cmmnElement.case.cfiEditor.removeDropHandler();
        });
        this.htmlContainer.append(html);
        return html;
    }

    addFourEyesField() {
        const planItem = this.cmmnElement.definition;
        const has4Eyes = planItem.fourEyes.present;
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
        const tasks = this.case.caseDefinition.getAllPlanItems().filter(item => item.definition instanceof HumanTaskDefinition);
        tasks.filter(task => task !== planItem).forEach(task => this.addTask(taskList, 'fourEyes', task));
        html.find(`#${checkboxIdentifier}`).on('click', e => {
            const newPresence = e.target.checked;
            html.find('.list-human-tasks').css('display', newPresence ? 'block' : 'none');
            if (!newPresence) {
                planItem.fourEyes.drop();
            } else {
                planItem.fourEyes.present = true;
            }
            this.done();
        });
        this.htmlContainer.append(html);
        return html;
    }

    addRendezVousField() {
        const planItem = this.cmmnElement.definition;
        const hasRendezVous = planItem.rendezVous.present;
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
        const tasks = this.case.caseDefinition.getAllPlanItems().filter(item => item.definition instanceof HumanTaskDefinition);
        tasks.filter(task => task !== planItem).forEach(task => this.addTask(taskList, 'rendezVous', task));
        html.find(`#${checkboxIdentifier}`).on('click', e => {
            const newPresence = e.target.checked;
            html.find('.list-human-tasks').css('display', newPresence ? 'block' : 'none');
            if (!newPresence) {
                planItem.rendezVous.drop();
            } else {
                planItem.rendezVous.present = true;
            }
            this.done();
        });
        this.htmlContainer.append(html);
        return html;
    }

    done() {
        super.done();
        // Also refresh other workflow properties ...
        this.case.items.filter(item => item instanceof HumanTaskView).map((/** @type{HumanTaskView} */ item) => item.workflowProperties && item.workflowProperties.visible && item.workflowProperties.refresh());
    }

    /**
     * Adds a task with a checkbox to enable or disable it with 4-eyes.
     * @param {String} workflowProperty 
     * @param {PlanItem} task 
     */
    addTask(htmlParent, workflowProperty, task) {
        const planItem = this.cmmnElement.definition;
        const isSelected = planItem[workflowProperty] && planItem[workflowProperty].has(task) ? true : false;

        const label = task.name;

        const checked = isSelected ? ' checked' : '';
        const checkboxIdentifier = Util.createID();
        const html = $(`<div class="propertyRule">
                            <div class="propertyRow">
                                <input id="${checkboxIdentifier}" type="checkbox" ${checked} />
                                <label for="${checkboxIdentifier}">${label}</label>
                            </div>
                        </div>`);
        html.on('change', e => {
            if (e.target.checked) {
                planItem[workflowProperty].add(task)
            } else {
                planItem[workflowProperty].remove(task)
            }
            this.done();
        });
        htmlParent.append(html);
        return html;
    }

    renderData() {
        this.addLabelField('Workflow properties for', `'${this.cmmnElement.name}'`);
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
