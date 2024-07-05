import UnnamedCMMNElementDefinition from "../../unnamedcmmnelementdefinition";
import CaseDefinition from "../casedefinition";
import ConstraintDefinition from "./constraintdefinition";
import PlanItem, { TaskStageDefinition } from "./planitem";

export default class PlanningTableDefinition extends UnnamedCMMNElementDefinition {
    /**
     * 
     * @param {Element} importNode 
     * @param {CaseDefinition} caseDefinition 
     * @param {TaskStageDefinition} parent 
     */
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
        const parentStage = parent.isTask ? parent.parent : parent;
        /** @type{Array<PlanItem>} */
        this.tableItems = parentStage.parseChildren(this);
        this.tableItems.forEach(item => item.parent = this);
        /** @type{Array<ApplicabilityRuleDefinition>} */
        this.ruleDefinitions = this.parseElements('applicabilityRule', ApplicabilityRuleDefinition);
        // TODO: PlanningTables can be nested in themselves, according to the spec. But we will not implement that here.
    }

    getAllPlanItems() {
        const items = new Array(...this.tableItems); // First copy all table entries
        this.tableItems.forEach(item => { // And for those that are of type stage, get the content as well.
            if (item.isStage) {
                items.push(...item.getAllPlanItems());
            }
        });

        return items;
    }

    createExportNode(parentNode) {
        super.createExportNode(parentNode, 'planningTable', 'tableItems', 'ruleDefinitions');
    }

    /** @returns {ApplicabilityRuleDefinition} */
    createNewRule() {
        const newRule = super.createDefinition(ApplicabilityRuleDefinition);
        this.ruleDefinitions.push(newRule);
        return newRule;
    }
}

export class ApplicabilityRuleDefinition extends ConstraintDefinition {
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
    }

    // Override isNamedElement; by default Constraints are unnamed, but applicability rules form the exception
    isNamedElement() {
        return true;
    }

    set sourceRef(ref) {
        this.contextRef = ref;
    }

    get sourceRef() {
        return this.contextRef ? this.contextRef : '';
    }

    createExportNode(parentNode) {
        super.createExportNode(parentNode, 'applicabilityRule');
    }
}