import { Element } from "../../../../util/xml";
import UnnamedCMMNElementDefinition from "../../unnamedcmmnelementdefinition";
import CaseDefinition from "../casedefinition";
import ConstraintDefinition from "./constraintdefinition";
import PlanItem from "./planitem";

export default class ItemControlDefinition extends UnnamedCMMNElementDefinition {
    repetitionRule?: ConstraintDefinition;
    requiredRule?: ConstraintDefinition;
    manualActivationRule?: ConstraintDefinition;

    constructor(importNode: Element, caseDefinition: CaseDefinition, parent: PlanItem) {
        super(importNode, caseDefinition, parent);
        this.repetitionRule = this.parseElement('repetitionRule', ConstraintDefinition);
        this.requiredRule = this.parseElement('requiredRule', ConstraintDefinition);
        this.manualActivationRule = this.parseElement('manualActivationRule', ConstraintDefinition);
    }

    /**
     * Gets or creates one of 'repetitionRule', 'requiredRule' or 'manualActivationRule'.
     */
    getRule(ruleName: string) {
        if (! (this as any)[ruleName]) {
            (this as any)[ruleName] = super.createDefinition(ConstraintDefinition);
        }
        return (this as any)[ruleName];
    }

    /**
     * Removes one of 'repetitionRule', 'requiredRule' or 'manualActivationRule'.
     */
    removeRule(ruleName: string) {
        delete (this as any)[ruleName];
    }

    createExportNode(parentNode: Element) {
        if (this.repetitionRule || this.requiredRule || this.manualActivationRule) {
            // Only export if there are any rules
            super.createExportNode(parentNode, 'itemControl', 'repetitionRule', 'requiredRule', 'manualActivationRule');
        }
    }
}