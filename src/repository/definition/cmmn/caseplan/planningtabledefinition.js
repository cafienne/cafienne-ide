import UnnamedCMMNElementDefinition from "../../unnamedcmmnelementdefinition";
import ConstraintDefinition from "./constraintdefinition";
import PlanItem from "./planitem";
// import StageDefinition from "./stagedefinition";
// BIG TODO HERE

export default class PlanningTableDefinition extends UnnamedCMMNElementDefinition {
    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
        /** @type{Array<PlanItem>} */
        this.tableItems = this.parseElements('discretionaryItem', PlanItem);
        /** @type{Array<ApplicabilityRuleDefinition>} */
        this.ruleDefinitions = this.parseElements('applicabilityRule', ApplicabilityRuleDefinition);
        // TODO: PlanningTables can be nested in themselves, according to the spec. But we will not implement that here.
    }

    getAllPlanItems() {
        const items = new Array(...this.tableItems); // First copy all table entries
        this.tableItems.forEach(item => { // And for those that are of type stage, get the content as well.
            if (item.definition instanceof StageDefinition) {
                items.push(...item.definition.getAllPlanItems());
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