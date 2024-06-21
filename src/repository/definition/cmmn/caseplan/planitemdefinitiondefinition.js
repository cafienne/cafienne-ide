import CMMNElementDefinition from "../../cmmnelementdefinition";
import PlanningTableDefinition from "./planningtabledefinition";

export default class PlanItemDefinitionDefinition extends CMMNElementDefinition {
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
    }

    /**
     * Returns a list of transitions valid for this type of plan item definition.
     * @returns {Array<String>}
     */
    get transitions() {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    /**
     * Returns the entry transition for this type of plan item definition (Task/Stage => Start, Event/Milestone => Occur)
     * @returns {String}
     */
    get entryTransition() {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }
}

/**
 * Simple helper class to re-use logic across stages and tasks
 */
export class TaskStageDefinition extends PlanItemDefinitionDefinition {
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
        /** @type{PlanningTableDefinition} */
        this.planningTable = this.parseElement('planningTable', PlanningTableDefinition);
    }

    getPlanningTable() {
        if (!this.planningTable) {
            /** @type{PlanningTableDefinition} */
            this.planningTable = super.createDefinition(PlanningTableDefinition); 
        }
        return this.planningTable;
    }

    get transitions() {
        return ['complete', 'create', 'disable', 'enable', 'exit', 'fault', 'manualStart', 'parentResume', 'parentSuspend', 'reactivate', 'reenable', 'resume', 'start', 'suspend', 'terminate'];
    }

    get defaultTransition() {
        return 'completes';
    }

    get entryTransition() {
        return 'start';
    }
}

/**
 * Simple helper class to re-use logic across milestones and event listeners
 */
export class MilestoneEventListenerDefinition extends PlanItemDefinitionDefinition {
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
    }

    get transitions() {
        return ['occur', 'create', 'reactivate', 'resume', 'suspend', 'terminate'];
    }

    get defaultTransition() {
        return 'occur';
    }

    get entryTransition() {
        return 'occur';
    }
}
