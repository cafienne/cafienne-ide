import Util from "../../../../util/util";
import { Element } from "../../../../util/xml";
import Validator from "../../../validate/validator";
import CMMNElementDefinition from "../../cmmnelementdefinition";
import { ReferenceSet } from "../../references/referenceset";
import CaseDefinition from "../casedefinition";
import CaseRoleReference from "../caseteam/caserolereference";
import CriterionDefinition from "../sentry/criteriondefinition";
import EntryCriterionDefinition from "../sentry/entrycriteriondefinition";
import ExitCriterionDefinition from "../sentry/exitcriteriondefinition";
import ReactivateCriterionDefinition from "../sentry/reactivatecriteriondefinition";
import ItemControlDefinition from "./itemcontrol/itemcontroldefinition";
import PlanItemTransition from "./planitemtransition";
import ApplicabilityRuleReference from "./planning/applicabilityrulereference";
import PlanningTableDefinition from "./planning/planningtabledefinition";
import StageDefinition from "./stagedefinition";
import FourEyesDefinition from "./task/workflow/foureyesdefinition";
import RendezVousDefinition from "./task/workflow/rendezvousdefinition";
import TaskStageDefinition from "./taskstagedefinition";

export default abstract class PlanItem extends CMMNElementDefinition {
    private applicabilityRuleRefs: ReferenceSet<ApplicabilityRuleReference>;
    public authorizedRoleRefs: ReferenceSet<CaseRoleReference>;

    planItemControl?: ItemControlDefinition;
    entryCriteria: EntryCriterionDefinition[];
    reactivateCriteria: ReactivateCriterionDefinition[];
    exitCriteria: ExitCriterionDefinition[];
    fourEyes?: FourEyesDefinition;
    rendezVous?: RendezVousDefinition;

    /**
     * @returns {String}
     */
    protected abstract infix(): string;

    get prefix(): string {
        return 'pi_' + this.infix();
    }

    constructor(importNode: Element, caseDefinition: CaseDefinition, public parent: TaskStageDefinition | PlanningTableDefinition) {
        super(importNode, caseDefinition, parent);
        this.planItemControl = this.parseElement('itemControl', ItemControlDefinition);
        this.entryCriteria = this.parseElements('entryCriterion', EntryCriterionDefinition, []);
        this.reactivateCriteria = this.parseExtensions(ReactivateCriterionDefinition, []);
        this.exitCriteria = this.parseElements('exitCriterion', ExitCriterionDefinition, []);

        // Properties below are special for discretionary items
        this.applicabilityRuleRefs = this.parseReferenceSet('applicabilityRuleRefs');
        this.authorizedRoleRefs = this.parseReferenceSet('authorizedRoleRefs');
        this.fourEyes = this.parseExtension(FourEyesDefinition);
        this.rendezVous = this.parseExtension(RendezVousDefinition);
    }

    validate(validator: Validator): void {
        super.validate(validator);
        validator.mustHaveName(this);
        // Validate entry criteria availability when this is a repeating element.
        if (this.itemControl.repetitionRule && this.entryCriteria.length > 0) {
            if (this.entryCriteria.filter(criterion => criterion.caseFileItemOnParts.length > 0 || criterion.planItemOnParts.length > 0).length === 0) {
                validator.raiseError(this, `${this} has a repetition rule defined, but no entry criteria with at least one on part. This is mandatory.`);
            }
        }

        // Check validity of authorized roles (happens both on discretionary elements and on user events)
        this.authorizedRoleRefs.references.forEach((reference, count) => {
            if (reference.isInvalid) validator.raiseError(this, `The ${Util.ordinal_suffix_of(count + 1)} authorized role in ${this} has an invalid reference ${reference.value}`)
        });

        if (this.isDiscretionary) {
            // Check that applicability rules exist.
            this.applicabilityRuleRefs.references.forEach((reference, count) => {
                if (reference.isInvalid) validator.raiseError(this, `The ${Util.ordinal_suffix_of(count + 1)} applicability rule in ${this} has an invalid reference ${reference.value}`)
            });
        }
    }

    get isDiscretionary(): boolean {
        return this.parent instanceof PlanningTableDefinition;
    }

    get itemControl() {
        if (!this.planItemControl) {
            this.planItemControl = super.createDefinition(ItemControlDefinition);
        }
        return this.planItemControl;
    }

    get applicabilityRules() {
        return this.applicabilityRuleRefs;
    }

    get authorizedRoles() {
        return this.authorizedRoleRefs.list;
    }

    private createSentry<CD extends CriterionDefinition>(criterionConstructor: new (importNode: Element, caseDefinition: CaseDefinition, parent: PlanItem) => CD, criterionCollection: CriterionDefinition[]) {
        const criterion: CriterionDefinition = super.createDefinition(criterionConstructor);
        criterionCollection.push(criterion);
        return criterion as CD;
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

    // resolvedExternalReferences() {
    // TODO: THIS CODE BELONGS IN MIGRATOR.JS
    //     const entryCriteriaRefs = this.parseAttribute('entryCriteriaRefs');
    //     if (entryCriteriaRefs) {
    //         const sentries = this.caseDefinition.findElements(entryCriteriaRefs, []);
    //         sentries.forEach(sentry => {
    //             const ec: EntryCriterionDefinition = super.createDefinition(EntryCriterionDefinition);
    //             this.entryCriteria.push(ec);
    //             this.caseDefinition.migrated(`Migrating CMMN1.0 Sentry in plan item ${this.name} into an EntryCriterion`);
    //         });
    //     }
    //     const exitCriteriaRefs = this.parseAttribute('exitCriteriaRefs');
    //     if (exitCriteriaRefs) {
    //         const sentries = this.caseDefinition.findElements(exitCriteriaRefs, []);
    //         sentries.forEach(sentry => {
    //             const ec: ExitCriterionDefinition = super.createDefinition(ExitCriterionDefinition);
    //             this.exitCriteria.push(ec);
    //             this.caseDefinition.migrated(`Migrating CMMN1.0 Sentry in plan item ${this.name} into an ExitCriterion`);
    //         });
    //     }
    // }

    createExportNode(parentNode: Element, tagName: string, ...propertyNames: any[]) {
        // this.authorizedRoleRefs = super.flattenListToString(this.authorizedRoles); // AuthorizedRoles can also have been defined on the UserEvent; therefore always flatten them.
        // Export applicabilityRuleRefs only if the item is discretionary; this ensures that if a element has switched from discretionary to planitem, it will NOT accidentally keep the role and rule refs.
        if (this.isDiscretionary) {
            super.createExportNode(parentNode, tagName, 'entryCriteria', 'reactivateCriteria', 'exitCriteria', 'planItemControl', 'applicabilityRuleRefs', 'authorizedRoleRefs', 'fourEyes', 'rendezVous', propertyNames);
        } else {
            super.createExportNode(parentNode, tagName, 'entryCriteria', 'reactivateCriteria', 'exitCriteria', 'planItemControl', 'authorizedRoleRefs', 'fourEyes', 'rendezVous', propertyNames);
        }
    }

    /**
     * Returns a list of transitions valid for this type of plan item definition.
     */
    abstract get transitions(): PlanItemTransition[];

    /**
     * Returns the default transition for this type of PlanItem
     */
    abstract get defaultTransition(): PlanItemTransition;

    /**
     * Returns the entry transition for this type of plan item definition (Task/Stage => Start, Event/Milestone => Occur)
     */
    abstract get entryTransition(): PlanItemTransition;
}
