import Util from "@util/util";
import CMMNElementDefinition from "../../cmmnelementdefinition";
import CaseRoleDefinition from "../caseteam/caseroledefinition";
import CaseRoleReference from "../caseteam/caserolereference";
import CriterionDefinition from "../sentry/criteriondefinition";
import EntryCriterionDefinition from "../sentry/entrycriteriondefinition";
import ExitCriterionDefinition from "../sentry/exitcriteriondefinition";
import ReactivateCriterionDefinition from "../sentry/reactivatecriteriondefinition";
import ItemControlDefinition from "./itemcontroldefinition";
import PlanningTableDefinition, { ApplicabilityRuleDefinition } from "./planningtabledefinition";
import FourEyesDefinition from "./task/workflow/foureyesdefinition";
import RendezVousDefinition from "./task/workflow/rendezvousdefinition";
import CaseDefinition from "../casedefinition";

export default class PlanItem extends CMMNElementDefinition {
    static get infix() {
        throw new Error('This method must be implemented in ' + this.name);
    }

    static get prefix() {
        return 'pi_' + this.infix;
    }

    /**
     * 
     * @param {Element} importNode 
     * @param {CaseDefinition} caseDefinition 
     * @param {TaskStageDefinition} parent 
     */
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
        // this.definitionRef = this.parseAttribute('definitionRef');
        this.definition = this;
        /** @type{ItemControlDefinition} */
        this.planItemControl = this.parseElement('itemControl', ItemControlDefinition);
        /** @type{Array<EntryCriterionDefinition>} */
        this.entryCriteria = this.parseElements('entryCriterion', EntryCriterionDefinition, []);
        /** @type{Array<ReactivateCriterionDefinition>} */
        this.reactivateCriteria = this.parseExtensions(ReactivateCriterionDefinition, []);
        /** @type{Array<ExitCriterionDefinition>} */
        this.exitCriteria = this.parseElements('exitCriterion', ExitCriterionDefinition, []);
        // Properties below are special for discretionary items
        this.applicabilityRuleRefs = this.parseAttribute('applicabilityRuleRefs');
        this.authorizedRoleRefs = this.parseAttribute('authorizedRoleRefs');
        /** @type{Array<ApplicabilityRuleDefinition>} */
        this.applicabilityRules = [];
        /** @type{Array<CaseRoleReference>} */
        this.authorizedRoles = [];
        this.fourEyes = this.parseExtension(FourEyesDefinition);
        this.rendezVous = this.parseExtension(RendezVousDefinition);
    }

    get isDiscretionary() {
        return this.parent instanceof PlanningTableDefinition;
    }

    /**
     * @returns {String}
     */
    get defaultTransition() {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    /**
     * @returns {ItemControlDefinition}
     */
    get itemControl() {
        if (!this.planItemControl) {
            this.planItemControl = super.createDefinition(ItemControlDefinition);
        }
        return this.planItemControl;
    }

    /**
     * @returns {FourEyesDefinition}
     */
    get fourEyes() {
        return this._4eyes;
    }

    set fourEyes(value) {
        this._4eyes = value;
    }

    /**
     * @returns {RendezVousDefinition}
     */
    get rendezVous() {
        return this._rendezVous;
    }

    set rendezVous(value) {
        this._rendezVous = value;
    }

    /**
     * 
     * @param {Function} criterionConstructor 
     * @param {Array<CriterionDefinition>} criterionCollection 
     * @returns {CriterionDefinition}
     */
    createSentry(criterionConstructor, criterionCollection) {
        const criterion = super.createDefinition(criterionConstructor);
        criterionCollection.push(criterion);
        return criterion;
    }

    createEntryCriterion() {
        return this.createSentry(EntryCriterionDefinition, this.entryCriteria);
    }

    createReactivateCriterion() {
        return this.createSentry(ReactivateCriterionDefinition, this.reactivateCriteria);
    }

    createExitCriterion() {
        return this.createSentry(ExitCriterionDefinition, this.exitCriteria);
    }

    /**
     * Method invoked when this plan item is getting a new parent (typically a stage or, if it is discretionary it can also be a human task).
     * @param {TaskStageDefinition} newParent 
     */
    switchParent(newParent) {
        if (this.isDiscretionary) {
            // Remove from current planning table, add to new parent's planning table
            // Remove ourselves from the planning table.
            const currentParent = this.parent;
            const formerPlanningTable = currentParent;
            Util.removeFromArray(currentParent.tableItems, this);
            Util.removeFromArray(currentParent.childDefinitions, this);
            const currentParentStage = currentParent.parent.isTask ? currentParent.parent.parent : currentParent.parent;
            // Add our selves to the new parent's planning table
            const newPlanningTable = newParent.getPlanningTable();
            newPlanningTable.childDefinitions.push(this);
            newPlanningTable.tableItems.push(this);
            this.parent = newPlanningTable;
            // Now check to see if we can cleanup former planning table
            //  NOTE: this logic is shifted to the View side of the house... would be better if we can trigger that from here.
            // formerPlanningTable.cleanupIfPossible();
        } else {
            if (!(newParent.isStage)) {
                throw new Error('Cannot change the parent of ' + this + ', since the new parent is not of type stage definition; instead it is ' + newParent);
            }
            const currentParentStage = this.parent;
            Util.removeFromArray(currentParentStage.planItems, this);
            Util.removeFromArray(currentParentStage.childDefinitions, this);
            this.parent = newParent;
            newParent.planItems.push(this);
            newParent.childDefinitions.push(this);
        }
    }

    /**
     * This method switches a PlanItem into a DiscretionaryItem and vice versa.
     * It also updates the underlying registrations.
     * @returns {PlanItem}
     */
    switchType() {
        if (this.isDiscretionary) {
            // Make it a regular plan item, and give it a new parent
            // Remove ourselves from the planning table.
            const planningTableDefinition = this.parent;
            Util.removeFromArray(planningTableDefinition.tableItems, this);
            Util.removeFromArray(planningTableDefinition.childDefinitions, this);
            // Check whether the new parent is a task or a stage. If this item was discretionary to a task, then we need to add the new plan item to the stage that task belongs to
            const stageDefinition = planningTableDefinition.parent.isTask ? planningTableDefinition.parent.parent : planningTableDefinition.parent;
            this.parent = stageDefinition;
            // And make ourselves known to the stage definition
            stageDefinition.planItems.push(this);
            stageDefinition.childDefinitions.push(this);
        } else {
            // Make it a discretionary item, and give it a new parent
            // Remove ourselves from our stage
            const stageDefinition = this.parent;
            Util.removeFromArray(stageDefinition.planItems, this);
            // Get the stage planning table and make that our new parent, and add us as a table item.
            this.parent = stageDefinition.getPlanningTable();
            this.parent.tableItems.push(this);
        }
        return this;
    }

    resolveReferences() {
        super.resolveReferences();

        const entryCriteriaRefs = this.parseAttribute('entryCriteriaRefs');
        if (entryCriteriaRefs) {
            const sentries = this.caseDefinition.findElements(entryCriteriaRefs, []);
            sentries.forEach(sentry => {
                const ec = super.createDefinition(EntryCriterionDefinition);
                ec.sentryRef = sentry.id;
                this.entryCriteria.push(ec);
                this.caseDefinition.migrated(`Migrating CMMN1.0 Sentry in plan item ${this.name} into an EntryCriterion`);
            });
        }
        const exitCriteriaRefs = this.parseAttribute('exitCriteriaRefs');
        if (exitCriteriaRefs) {
            const sentries = this.caseDefinition.findElements(exitCriteriaRefs, []);
            sentries.forEach(sentry => {
                const ec = super.createDefinition(ExitCriterionDefinition);
                ec.sentryRef = sentry.id;
                this.exitCriteria.push(ec);
                this.caseDefinition.migrated(`Migrating CMMN1.0 Sentry in plan item ${this.name} into an ExitCriterion`);
            });
        }

        // Resolve discretionary properties        
        /** @type {Array<CaseRoleReference>} */
        this.authorizedRoles = this.caseDefinition.findElements(this.authorizedRoleRefs, [], CaseRoleDefinition).map(role => new CaseRoleReference(role, this));
        /** @type {Array<ApplicabilityRuleDefinition>} */
        this.applicabilityRules = this.caseDefinition.findElements(this.applicabilityRuleRefs, [], ApplicabilityRuleDefinition);
    }

    createExportNode(parentNode, tagName, ...propertyNames) {
        // Flatten discretionary properties; this ensures that if a element has switched from discretionary to planitem, it will NOT accidentally keep the role and rule refs.
        this.authorizedRoleRefs = super.flattenListToString(this.isDiscretionary ? this.authorizedRoles : []);
        this.applicabilityRuleRefs = super.flattenListToString(this.isDiscretionary ? this.filterExistingRules() : []);
        super.createExportNode(parentNode, tagName, 'entryCriteria', 'reactivateCriteria', 'exitCriteria', 'planItemControl', 'applicabilityRuleRefs', 'authorizedRoleRefs', 'fourEyes', 'rendezVous', propertyNames);
    }

    /**
     * Filters the list of applicability rules to contain only those that exist in the case definition (the list on this planitem may hold stale references)
     * @returns {Array<ApplicabilityRuleDefinition>}
     */
    filterExistingRules() {
        return this.applicabilityRules.filter(rule => this.caseDefinition.getElement(rule.id));
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
export class TaskStageDefinition extends PlanItem {
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

    get isTask() {
        return false;
    }

    get isStage() {
        return false;
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
export class MilestoneEventListenerDefinition extends PlanItem {
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
