import { Element } from "../../../../util/xml";
import Validator from "../../../validate/validator";
import UnnamedCMMNElementDefinition from "../../unnamedcmmnelementdefinition";
import CaseDefinition from "../casedefinition";
import CaseFileItemTransition from "../casefile/casefileitemtransition";
import PlanItem from "../caseplan/planitem";
import CaseFileItemOnPartDefinition from "./casefileitemonpartdefinition";
import IfPartDefinition from "./ifpartdefinition";
import PlanItemOnPartDefinition from "./planitemonpartdefinition";

export default class CriterionDefinition extends UnnamedCMMNElementDefinition {
    ifPart?: IfPartDefinition;
    caseFileItemOnParts: CaseFileItemOnPartDefinition[];
    planItemOnParts: PlanItemOnPartDefinition[];

    constructor(importNode: Element, caseDefinition: CaseDefinition, public parent: PlanItem) {
        super(importNode, caseDefinition, parent);
        this.parent = parent;
        this.ifPart = this.parseElement('ifPart', IfPartDefinition);
        this.caseFileItemOnParts = this.parseElements('caseFileItemOnPart', CaseFileItemOnPartDefinition);
        this.planItemOnParts = this.parseElements('planItemOnPart', PlanItemOnPartDefinition);
    }

    static get prefix() {
        return 'crit';
    }

    validate(validator: Validator) {
        const hasOnParts = this.caseFileItemOnParts.length > 0 || this.planItemOnParts.length > 0;
        if (!hasOnParts) {
            if (this.ifPart) {
                if (this.ifPart.contextRef.isEmpty) {
                    validator.raiseError(this, `An ${this} in ${this.parent} has an ifPart without onParts. Then a CaseFileItem must be set in the context`);
                }
            } else {
                validator.raiseError(this, `An ${this} in ${this.parent} is empty, but must have either an ifPart or an onPart`);
            }
        }
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
        onPart.standardEvent = CaseFileItemTransition.Create; // Set the default event for case file items
        this.caseFileItemOnParts.push(onPart);
        return onPart;
    }

    createExportNode(parentNode: Element, tagName: string) {
        super.createExportNode(parentNode, tagName, 'ifPart', 'caseFileItemOnParts', 'planItemOnParts');
    }
}
