import SentryDefinition from "./sentrydefinition";

export default class CriterionDefinition extends SentryDefinition {
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
    }

    /**
     * @returns {SentryDefinition}
     */
    get sentry() {
        return this;
    }

    /**
     * @param {Element} parentNode 
     * @param {String} tagName 
     */
    createExportNode(parentNode, tagName) {
        super.createExportNode(parentNode, tagName);
    }
}
