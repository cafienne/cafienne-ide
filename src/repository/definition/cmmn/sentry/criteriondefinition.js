import CMMNElementDefinition from "../../cmmnelementdefinition";
import CaseFileItemOnPartDefinition from "./casefileitemonpartdefinition";
import IfPartDefinition from "./ifpartdefinition";
import PlanItemOnPartDefinition from "./planitemonpartdefinition";
import SentryDefinition from "./sentrydefinition";

export default class CriterionDefinition extends CMMNElementDefinition {
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
        this.sentryRef = this.parseAttribute('sentryRef');
    }

    get ifPart() {
        return this.sentry.ifPart;
    }

    get caseFileItemOnParts() {
        return this.sentry.caseFileItemOnParts;
    }

    get planItemOnParts() {
        return this.sentry.planItemOnParts;
    }

    /**
     * @returns {SentryDefinition}
     */
    get sentry() {
        return this.caseDefinition.getElement(this.sentryRef, SentryDefinition);
    }

    /**
     * @returns {IfPartDefinition}
     */
    getIfPart() {
        return this.sentry.getIfPart();
    }

    /**
     * @returns {PlanItemOnPartDefinition}
     */
    createPlanItemOnPart() {
        return this.sentry.createPlanItemOnPart();
    }

    /**
     * @returns {CaseFileItemOnPartDefinition}
     */
    createCaseFileItemOnPart() {
        return this.sentry.createCaseFileItemOnPart();
    }

    /**
     * @param {Element} parentNode 
     * @param {String} tagName 
     */
    createExportNode(parentNode, tagName) {
        super.createExportNode(parentNode, tagName, 'sentryRef');
    }

    removeDefinition() {
        // Since sentry is not a child of criterion, but has an independent place inside the parent stage, we will also remove it from the stage
        this.sentry.removeDefinition();
        super.removeDefinition();
    }
}
