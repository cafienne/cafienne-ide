import CaseDefinition from "../casedefinition";
import PlanItem from "../caseplan/planitem";
import CriterionDefinition from "./criteriondefinition";
import OnPartDefinition from "./onpartdefinition";

export default class PlanItemOnPartDefinition extends OnPartDefinition<PlanItem> {
    exitCriterionRef: string;

    constructor(importNode: Element, caseDefinition: CaseDefinition, parent: CriterionDefinition) {
        super(importNode, caseDefinition, parent);
        const cmmn10Ref = this.parseAttribute('sentryRef');
        const exitCriterionRef = this.parseAttribute('exitCriterionRef');
        if (cmmn10Ref && !exitCriterionRef) {
            this.caseDefinition.migrated('Migrating CMMN1.0 sentryRef into exitCriterionRef')
        }
        this.exitCriterionRef = this.parseAttribute('exitCriterionRef', cmmn10Ref);
    }

    createExportNode(parentNode: Element) {
        super.createExportNode(parentNode, 'planItemOnPart', 'exitCriterionRef');
    }
}
