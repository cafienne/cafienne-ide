import Util from "@util/util";
import CMMNElementDefinition from "../../cmmnelementdefinition";
import CaseRoleDefinition from "../caseteam/caseroledefinition";
import CaseRoleReference from "../caseteam/caserolereference";
import CriterionDefinition from "../sentry/criteriondefinition";
import EntryCriterionDefinition from "../sentry/entrycriteriondefinition";
import ExitCriterionDefinition from "../sentry/exitcriteriondefinition";
import ReactivateCriterionDefinition from "../sentry/reactivatecriteriondefinition";
import ItemControlDefinition from "./itemcontroldefinition";
import PlanItemDefinitionDefinition, { TaskStageDefinition } from "./planitemdefinitiondefinition";
import PlanningTableDefinition, { ApplicabilityRuleDefinition } from "./planningtabledefinition";
import FourEyesDefinition from "./task/workflow/foureyesdefinition";
import RendezVousDefinition from "./task/workflow/rendezvousdefinition";
// import StageDefinition from "./stagedefinition";
// import TaskDefinition from "./task/taskdefinition";
// BIG TODO HERE

export default class PlanItem extends CMMNElementDefinition {
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
        this.definitionRef = this.parseAttribute('definitionRef');
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
        this.isDiscretionary = parent instanceof PlanningTableDefinition;
        /** @type{Array<ApplicabilityRuleDefinition>} */
        this.applicabilityRules = [];
        /** @type{Array<CaseRoleReference>} */
        this.authorizedRoles = [];
        this.fourEyes = this.parseExtension(FourEyesDefinition);
        this.rendezVous = this.parseExtension(RendezVousDefinition);
    }

    /**
     * @returns {String}
     */
    get defaultTransition() {
        return this.definition.defaultTransition;
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
     * Returns the stage to which this plan item belongs (this.parent is not the stage for discretionary items)
     * @returns {StageDefinition}
     */
    getStage() {
        if (this.isDiscretionary) {
            const planningTable = this.parent;
            if (planningTable.parent instanceof TaskDefinition) {
                return planningTable.parent.parent;
            } else {
                return planningTable.parent;
            }
        } else {
            return this.parent;
        }
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
        const sentry = this.getStage().createSentry();
        const criterion = super.createDefinition(criterionConstructor);
        criterion.sentryRef = sentry.id;
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
            const currentParentStage = currentParent.parent instanceof TaskDefinition ? currentParent.parent.parent : currentParent.parent;
            // Add our selves to the new parent's planning table
            const newPlanningTable = newParent.getPlanningTable();
            newPlanningTable.childDefinitions.push(this);
            newPlanningTable.tableItems.push(this);
            this.parent = newPlanningTable;
            // Now check to see if we can cleanup former planning table
            //  NOTE: this logic is shifted to the View side of the house... would be better if we can trigger that from here.
            // formerPlanningTable.cleanupIfPossible();
        } else {
            if (! (newParent instanceof StageDefinition)) {
                throw new Error('Cannot change the parent of '+this+', since the new parent is not of type stage definition; instead it is '+newParent);
            }
            const currentParentStage = this.parent;
            Util.removeFromArray(currentParentStage.planItems, this);
            Util.removeFromArray(currentParentStage.childDefinitions, this);
            this.parent = newParent;
            newParent.planItems.push(this);
            newParent.childDefinitions.push(this);
            
            // Finally make sure that the sentries of our entry and exit criteria also move to the new parent
            this.entryCriteria.forEach(c => c.sentry.switchParent(newParent));
            this.exitCriteria.forEach(c => c.sentry.switchParent(newParent));
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
            this.isDiscretionary = false;
            // Remove ourselves from the planning table.
            const planningTableDefinition = this.parent;
            Util.removeFromArray(planningTableDefinition.tableItems, this);
            Util.removeFromArray(planningTableDefinition.childDefinitions, this);
            // Check whether the new parent is a task or a stage. If this item was discretionary to a task, then we need to add the new plan item to the stage that task belongs to
            const stageDefinition = planningTableDefinition.parent instanceof TaskDefinition ? planningTableDefinition.parent.parent : planningTableDefinition.parent;
            this.parent = stageDefinition;
            // And make ourselves known to the stage definition
            stageDefinition.planItems.push(this);
            stageDefinition.childDefinitions.push(this);
        } else {
            // Make it a discretionary item, and give it a new parent
            this.isDiscretionary = true;
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
            const sentries = this.caseDefinition.findElements(entryCriteriaRefs, [], SentryDefinition);
            sentries.forEach(sentry => {
                const ec = super.createDefinition(EntryCriterionDefinition);
                ec.sentryRef = sentry.id;
                this.entryCriteria.push(ec);
                this.caseDefinition.migrated(`Migrating CMMN1.0 Sentry in plan item ${this.name} into an EntryCriterion`);
            });
        }
        const exitCriteriaRefs = this.parseAttribute('exitCriteriaRefs');
        if (exitCriteriaRefs) {
            const sentries = this.caseDefinition.findElements(exitCriteriaRefs, [], SentryDefinition);
            sentries.forEach(sentry => {
                const ec = super.createDefinition(ExitCriterionDefinition);
                ec.sentryRef = sentry.id;
                this.exitCriteria.push(ec);
                this.caseDefinition.migrated(`Migrating CMMN1.0 Sentry in plan item ${this.name} into an ExitCriterion`);
            });
        }

        /** @type {PlanItemDefinitionDefinition} */
        this.definition = this.caseDefinition.getElement(this.definitionRef);
        // Resolve discretionary properties        
        /** @type {Array<CaseRoleReference>} */
        this.authorizedRoles = this.caseDefinition.findElements(this.authorizedRoleRefs, [], CaseRoleDefinition).map(role => new CaseRoleReference(role, this));
        /** @type {Array<ApplicabilityRuleDefinition>} */
        this.applicabilityRules = this.caseDefinition.findElements(this.applicabilityRuleRefs, [], ApplicabilityRuleDefinition);
    }

    createExportNode(parentNode) {
        // Update some properties before exporting them
        if (this.definition) {
            this.definitionRef = this.definition.id;
            this.definition.name = this.name;
            if (this.definition.documentation.text === this.documentation.text) {
                this.definition.documentation.text = '';
            }    
        }
        // Flatten discretionary properties; this ensures that if a element has switched from discretionary to planitem, it will NOT accidentally keep the role and rule refs.
        this.authorizedRoleRefs = super.flattenListToString(this.isDiscretionary ? this.authorizedRoles : []);
        this.applicabilityRuleRefs = super.flattenListToString(this.isDiscretionary ? this.filterExistingRules() : []);

        const tagName = this.isDiscretionary ? 'discretionaryItem' : 'planItem';
        super.createExportNode(parentNode, tagName, 'definitionRef', 'entryCriteria', 'reactivateCriteria', 'exitCriteria', 'planItemControl', 'applicabilityRuleRefs', 'authorizedRoleRefs', 'fourEyes', 'rendezVous');
    }

    removeDefinition() {
        // first, remove our planitemdefinitiondefinition
        this.definition && this.definition.removeDefinition();
        super.removeDefinition();
    }

    /**
     * Filters the list of applicability rules to contain only those that exist in the case definition (the list on this planitem may hold stale references)
     * @returns {Array<ApplicabilityRuleDefinition>}
     */
    filterExistingRules() {
        return this.applicabilityRules.filter(rule => this.caseDefinition.getElement(rule.id));
    }
}
