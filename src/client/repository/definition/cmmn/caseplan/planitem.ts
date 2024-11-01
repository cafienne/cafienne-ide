import Util from "@util/util";
import CMMNElementDefinition from "../../cmmnelementdefinition";
import CaseDefinition from "../casedefinition";
import CaseRoleDefinition from "../caseteam/caseroledefinition";
import CaseRoleReference from "../caseteam/caserolereference";
import CriterionDefinition from "../sentry/criteriondefinition";
import EntryCriterionDefinition from "../sentry/entrycriteriondefinition";
import ExitCriterionDefinition from "../sentry/exitcriteriondefinition";
import ReactivateCriterionDefinition from "../sentry/reactivatecriteriondefinition";
import ItemControlDefinition from "./itemcontroldefinition";
import PlanningTableDefinition, { ApplicabilityRuleDefinition } from "./planningtabledefinition";
import StageDefinition from "./stagedefinition";
import FourEyesDefinition from "./task/workflow/foureyesdefinition";
import RendezVousDefinition from "./task/workflow/rendezvousdefinition";

export default class PlanItem extends CMMNElementDefinition {
    private applicabilityRuleRefs: string;
    private authorizedRoleRefs: string;

    planItemControl?: ItemControlDefinition;
    entryCriteria: EntryCriterionDefinition[];
    reactivateCriteria: ReactivateCriterionDefinition[];
    exitCriteria: ExitCriterionDefinition[];
    applicabilityRules: ApplicabilityRuleDefinition[] = [];
    authorizedRoles: CaseRoleReference[] = [];
    fourEyes?: FourEyesDefinition;
    rendezVous?: RendezVousDefinition;

    /**
     * @returns {String}
     */
    static get infix(): string {
        throw new Error('This method must be implemented in ' + this.name);
    }

    static get prefix(): string {
        return 'pi_' + this.infix;
    }

    constructor(importNode: Element, caseDefinition: CaseDefinition, public parent: TaskStageDefinition | PlanningTableDefinition) {
        super(importNode, caseDefinition, parent);
        this.planItemControl = this.parseElement('itemControl', ItemControlDefinition);
        this.entryCriteria = this.parseElements('entryCriterion', EntryCriterionDefinition, []);
        this.reactivateCriteria = this.parseExtensions(ReactivateCriterionDefinition, []);
        this.exitCriteria = this.parseElements('exitCriterion', ExitCriterionDefinition, []);

        // Properties below are special for discretionary items
        this.applicabilityRuleRefs = this.parseAttribute('applicabilityRuleRefs');
        this.authorizedRoleRefs = this.parseAttribute('authorizedRoleRefs');
        this.fourEyes = this.parseExtension(FourEyesDefinition);
        this.rendezVous = this.parseExtension(RendezVousDefinition);
    }

    get isDiscretionary(): boolean {
        return this.parent instanceof PlanningTableDefinition;
    }

    get defaultTransition(): string {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    get itemControl() {
        if (!this.planItemControl) {
            this.planItemControl = super.createDefinition(ItemControlDefinition);
        }
        return this.planItemControl;
    }

    private createSentry(criterionConstructor: Function, criterionCollection: CriterionDefinition[]) {
        const criterion: CriterionDefinition = super.createDefinition(criterionConstructor);
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
     */
    switchParent(newParent: TaskStageDefinition) {
        if (this.isDiscretionary) {
            // Remove from current planning table, add to new parent's planning table
            // Remove ourselves from the planning table.
            const currentParent = <PlanningTableDefinition>this.parent;
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
            const currentParentStage = <TaskStageDefinition>this.parent;
            if (currentParentStage instanceof StageDefinition) Util.removeFromArray(currentParentStage.planItems, this);
            Util.removeFromArray(currentParentStage.childDefinitions, this);
            this.parent = newParent;
            (<StageDefinition>newParent).planItems.push(this);
            newParent.childDefinitions.push(this);
        }
    }

    /**
     * This method switches a PlanItem into a DiscretionaryItem and vice versa.
     * It also updates the underlying registrations.
     */
    switchType(): PlanItem {
        if (this.isDiscretionary) {
            // Make it a regular plan item, and give it a new parent
            // Remove ourselves from the planning table.
            const planningTableDefinition = <PlanningTableDefinition>this.parent;
            Util.removeFromArray(planningTableDefinition.tableItems, this);
            Util.removeFromArray(planningTableDefinition.childDefinitions, this);
            // Check whether the new parent is a task or a stage. If this item was discretionary to a task, then we need to add the new plan item to the stage that task belongs to
            const stageDefinition = <StageDefinition>(planningTableDefinition.parent.isTask ? planningTableDefinition.parent.parent : planningTableDefinition.parent);
            this.parent = stageDefinition;
            // And make ourselves known to the stage definition
            stageDefinition.planItems.push(this);
            stageDefinition.childDefinitions.push(this);
        } else {
            // Make it a discretionary item, and give it a new parent
            // Remove ourselves from our stage
            const stageDefinition = <StageDefinition>this.parent;
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
                const ec: EntryCriterionDefinition = super.createDefinition(EntryCriterionDefinition);
                this.entryCriteria.push(ec);
                this.caseDefinition.migrated(`Migrating CMMN1.0 Sentry in plan item ${this.name} into an EntryCriterion`);
            });
        }
        const exitCriteriaRefs = this.parseAttribute('exitCriteriaRefs');
        if (exitCriteriaRefs) {
            const sentries = this.caseDefinition.findElements(exitCriteriaRefs, []);
            sentries.forEach(sentry => {
                const ec: ExitCriterionDefinition = super.createDefinition(ExitCriterionDefinition);
                this.exitCriteria.push(ec);
                this.caseDefinition.migrated(`Migrating CMMN1.0 Sentry in plan item ${this.name} into an ExitCriterion`);
            });
        }

        // Resolve discretionary properties        
        this.authorizedRoles = this.caseDefinition.findElements(this.authorizedRoleRefs, [], CaseRoleDefinition).map(role => new CaseRoleReference(role, this));
        this.applicabilityRules = this.caseDefinition.findElements(this.applicabilityRuleRefs, [], ApplicabilityRuleDefinition);
    }

    createExportNode(parentNode: Element, tagName: string, ...propertyNames: any[]) {
        this.authorizedRoleRefs = super.flattenListToString(this.authorizedRoles); // AuthorizedRoles can also have been defined on the UserEvent; therefore always flatten them.
        // Flatten applicabilityRuleRefs only if the item is discretionary; this ensures that if a element has switched from discretionary to planitem, it will NOT accidentally keep the role and rule refs.
        this.applicabilityRuleRefs = super.flattenListToString(this.isDiscretionary ? this.filterExistingRules() : []);
        super.createExportNode(parentNode, tagName, 'entryCriteria', 'reactivateCriteria', 'exitCriteria', 'planItemControl', 'applicabilityRuleRefs', 'authorizedRoleRefs', 'fourEyes', 'rendezVous', propertyNames);
    }

    /**
     * Filters the list of applicability rules to contain only those that exist in the case definition (the list on this planitem may hold stale references)
     */
    filterExistingRules() {
        return this.applicabilityRules.filter(rule => this.caseDefinition.getElement(rule.id));
    }

    /**
     * Returns a list of transitions valid for this type of plan item definition.
     */
    get transitions(): string[] {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    /**
     * Returns the entry transition for this type of plan item definition (Task/Stage => Start, Event/Milestone => Occur)
     */
    get entryTransition(): string {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }
}

/**
 * Simple helper class to re-use logic across stages and tasks
 */
export class TaskStageDefinition extends PlanItem {
    planningTable?: PlanningTableDefinition;
    constructor(importNode: Element, caseDefinition: CaseDefinition, public parent: TaskStageDefinition | PlanningTableDefinition) {
        super(importNode, caseDefinition, parent);
        this.planningTable = this.parseElement('planningTable', PlanningTableDefinition);
    }

    getPlanningTable() {
        if (!this.planningTable) {
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
        return 'complete';
    }

    get entryTransition() {
        return 'start';
    }
}

/**
 * Simple helper class to re-use logic across milestones and event listeners
 */
export class MilestoneEventListenerDefinition extends PlanItem {
    get transitions(): string[] {
        return ['occur', 'create', 'reactivate', 'resume', 'suspend', 'terminate'];
    }

    get defaultTransition() {
        return 'occur';
    }

    get entryTransition() {
        return 'occur';
    }
}
