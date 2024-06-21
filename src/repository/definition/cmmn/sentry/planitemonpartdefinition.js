import OnPartDefinition from "./onpartdefinition";

export default class PlanItemOnPartDefinition extends OnPartDefinition {
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent, PlanItem);
        const cmmn10Ref = this.parseAttribute('sentryRef');
        const exitCriterionRef = this.parseAttribute('exitCriterionRef');
        if (cmmn10Ref && !exitCriterionRef) {
            this.caseDefinition.migrated('Migrating CMMN1.0 sentryRef into exitCriterionRef')
        }
        this.exitCriterionRef = this.parseAttribute('exitCriterionRef', cmmn10Ref);
    }

    createExportNode(parentNode) {
        super.createExportNode(parentNode, 'planItemOnPart', 'exitCriterionRef');
    }
}
