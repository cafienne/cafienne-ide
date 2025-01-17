import UnnamedCMMNElementDefinition from "../../unnamedcmmnelementdefinition";
import CaseDefinition from "../casedefinition";
import PlanItem from "../caseplan/planitem";
import IfPartDefinition from "./ifpartdefinition";
import CaseFileItemOnPartDefinition from "./casefileitemonpartdefinition";
import PlanItemOnPartDefinition from "./planitemonpartdefinition";

export default class CriterionDefinition extends UnnamedCMMNElementDefinition {
    ifPart?: IfPartDefinition;
    caseFileItemOnParts: CaseFileItemOnPartDefinition[];
    planItemOnParts: PlanItemOnPartDefinition[];

    constructor(importNode: Element, caseDefinition: CaseDefinition, parent: PlanItem) {
        super(importNode, caseDefinition, parent);
        this.parent = parent;
        this.ifPart = this.parseElement('ifPart', IfPartDefinition);
        this.caseFileItemOnParts = this.parseElements('caseFileItemOnPart', CaseFileItemOnPartDefinition);
        this.planItemOnParts = this.parseElements('planItemOnPart', PlanItemOnPartDefinition);
    }

    static get prefix() {
        return 'crit';
    }

    getIfPart() {
        if (!this.ifPart) {
            this.ifPart = super.createDefinition(IfPartDefinition);
            this.ifPart.language = 'spel'; // Default language
        }
        return this.ifPart;
    }

    createPlanItemOnPart() {
        const onPart: PlanItemOnPartDefinition = this.createDefinition(PlanItemOnPartDefinition);
        this.planItemOnParts.push(onPart);
        return onPart;
    }

    createCaseFileItemOnPart() {
        const onPart: CaseFileItemOnPartDefinition = this.createDefinition(CaseFileItemOnPartDefinition);
        onPart.standardEvent = 'create'; // Set the default event for case file items
        this.caseFileItemOnParts.push(onPart);
        return onPart;
    }

    createExportNode(parentNode: Element, tagName: string) {
        super.createExportNode(parentNode, tagName, 'ifPart', 'caseFileItemOnParts', 'planItemOnParts');
    }
}
