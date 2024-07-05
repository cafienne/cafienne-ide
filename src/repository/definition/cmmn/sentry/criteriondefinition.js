import UnnamedCMMNElementDefinition from "@repository/definition/unnamedcmmnelementdefinition";
import CaseDefinition from "../casedefinition";
import PlanItem from "../caseplan/planitem";
import IfPartDefinition from "./ifpartdefinition";
import CaseFileItemOnPartDefinition from "./casefileitemonpartdefinition";
import PlanItemOnPartDefinition from "./planitemonpartdefinition";

export default class CriterionDefinition extends UnnamedCMMNElementDefinition {
    /**
     * 
     * @param {Element} importNode 
     * @param {CaseDefinition} caseDefinition 
     * @param {PlanItem} parent 
     */
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
        /** @type {PlanItem} */
        this.parent = parent;
        /** @type {IfPartDefinition} */
        this.ifPart = this.parseElement('ifPart', IfPartDefinition);
        /** @type {Array<CaseFileItemOnPartDefinition>} */
        this.caseFileItemOnParts = this.parseElements('caseFileItemOnPart', CaseFileItemOnPartDefinition);
        /** @type {Array<PlanItemOnPartDefinition>} */
        this.planItemOnParts = this.parseElements('planItemOnPart', PlanItemOnPartDefinition);
    }

    static get prefix() {
        return 'crit';
    }

    getIfPart() {
        if (!this.ifPart) {
            /** @type{IfPartDefinition} */
            this.ifPart = super.createDefinition(IfPartDefinition);
            this.ifPart.language = 'spel'; // Default language
        }
        return this.ifPart;
    }

    /**
     * @returns {PlanItemOnPartDefinition}
     */
    createPlanItemOnPart() {
        const onPart = this.createDefinition(PlanItemOnPartDefinition);
        this.planItemOnParts.push(onPart);
        return onPart;
    }

    /**
     * @returns {CaseFileItemOnPartDefinition}
     */
    createCaseFileItemOnPart() {
        const onPart = this.createDefinition(CaseFileItemOnPartDefinition);
        onPart.standardEvent = 'create'; // Set the default event for case file items
        this.caseFileItemOnParts.push(onPart);
        return onPart;
    }

    /**
     * @param {Element} parentNode 
     * @param {String} tagName 
     */
    createExportNode(parentNode, tagName) {
        super.createExportNode(parentNode, tagName, 'ifPart', 'caseFileItemOnParts', 'planItemOnParts');
    }

    /**
     * @returns {CriterionDefinition}
     */
    get sentry() {
        return this;
    }
}
