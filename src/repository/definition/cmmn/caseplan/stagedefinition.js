import SentryDefinition from "../sentry/sentrydefinition";
import PlanItem from "./planitem";
import { TaskStageDefinition } from "./planitemdefinitiondefinition";
import HumanTaskDefinition from "./task/humantaskdefinition";

export default class StageDefinition extends TaskStageDefinition {
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
        this.autoComplete = this.parseBooleanAttribute('autoComplete', true);
        /** @type {Array<PlanItem>} */
        this.planItems = this.parseElements('planItem', PlanItem);
    }

    get isStage() {
        return true;
    }

    /**
     * Creates a new plan item, along with a plan item definition of the specified type
     * @param {Function} type
     * @returns {PlanItem}
     */
    createPlanItem(type) {
        // For now, plan item definitions are always kept inside the case plan 
        const planItemDefinition = this.caseDefinition.getCasePlan().createPlanItemDefinition(type);
        const planItem = super.createDefinition(PlanItem, 'pi_' + planItemDefinition.id, planItemDefinition.name);
        planItem.definition = planItemDefinition;
        this.planItems.push(planItem);
        return planItem;
    }

    /**
     * Return all plan items in this stage and its children, including all discretionaries.
     * @returns {Array<PlanItem>}
     */
    getAllPlanItems() {
        const items = new Array(...this.planItems); // First copy all our children

        if (this.planningTable) { // Next, copy all discretionary items in our stage
            items.push(...this.planningTable.getAllPlanItems());
        }
        this.planItems.forEach(item => { // And then also all discretionaries in our human tasks
            if (item.definition instanceof HumanTaskDefinition) {
                if (item.definition.planningTable) {
                    items.push(...item.definition.planningTable.getAllPlanItems());
                }
            }
        });
        this.planItems.forEach(item => { // Ffinally copy the items of our children of type stage.
            if (item.definition instanceof StageDefinition) {
                items.push(...item.definition.getAllPlanItems());
            }
        });

        return items;
    }

    /**
     * @returns {SentryDefinition}
     */
    createSentry() {
        const sentry = super.createDefinition(SentryDefinition);
        this.sentries.push(sentry);
        return sentry;
    }

    createExportNode(parentNode, tagName = 'stage', ...propertyNames) {
        tagName = tagName == 'planItemDefinitions' ? 'stage' : tagName; // Override tagName for casePlan, but not for planItemDefinitions elements.
        super.createExportNode(parentNode, tagName, 'autoComplete', 'planItems', 'sentries', 'planningTable', propertyNames);
    }
}
