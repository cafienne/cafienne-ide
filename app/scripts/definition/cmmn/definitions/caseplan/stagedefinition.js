class StageDefinition extends TaskStageDefinition {
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
        this.autoComplete = this.parseBooleanAttribute('autoComplete', true);
        this.planItems = this.parseElements('planItem', PlanItem);
        this.sentries = this.parseElements('sentry', SentryDefinition);
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
