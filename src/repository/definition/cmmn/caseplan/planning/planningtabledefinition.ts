import ElementDefinition from "@repository/definition/elementdefinition";
import UnnamedCMMNElementDefinition from "@repository/definition/unnamedcmmnelementdefinition";
import CaseDefinition from "../../casedefinition";
import PlanItem, { TaskStageDefinition } from "../planitem";
import StageDefinition from "../stagedefinition";
import { ApplicabilityRuleDefinition } from "./applicabilityruledefinition";

export default class PlanningTableDefinition extends UnnamedCMMNElementDefinition {
    tableItems: any;
    ruleDefinitions: ApplicabilityRuleDefinition[];

    constructor(importNode: Element, caseDefinition: CaseDefinition, public parent: TaskStageDefinition) {
        super(importNode, caseDefinition, parent);
        this.parent = parent;

        // This planning table attached to a HumanTask or in a Stage
        //  If it is a HumanTask, then the task might be discretionary, 
        //   and then that task lives inside a PlanningTable to the stage or task around it.
        // This code recursively tries to find the nearest stage around this planning table
        const getParentStage = (surrounder: ElementDefinition<CaseDefinition>): StageDefinition => {
            if (surrounder instanceof StageDefinition) {
                return surrounder;
            }
            if (!surrounder.parent) {
                // This actually means that our parent is not a task or stage ... should never happen
                throw new Error('Kindly report this unexpected error')
            } else {
                return getParentStage(surrounder.parent);
            }
        }

        /** @type{Array<PlanItem>} */
        this.tableItems = getParentStage(parent).parseChildren(this);
        this.tableItems.forEach((item: PlanItem) => item.parent = this);
        /** @type{Array<ApplicabilityRuleDefinition>} */
        this.ruleDefinitions = this.parseElements('applicabilityRule', ApplicabilityRuleDefinition);
        // TODO: PlanningTables can be nested in themselves, according to the spec. But we will not implement that here.
    }

    getAllPlanItems() {
        const items: PlanItem[] = new Array(...this.tableItems); // First copy all table entries
        this.tableItems.forEach((item: PlanItem) => { // And for those that are of type stage, get the content as well.
            if (item instanceof StageDefinition) {
                items.push(...item.getAllPlanItems());
            }
        });

        return items;
    }

    createExportNode(parentNode: Element) {
        super.createExportNode(parentNode, 'planningTable', 'tableItems', 'ruleDefinitions');
    }

    createNewRule() {
        const newRule: ApplicabilityRuleDefinition = super.createDefinition(ApplicabilityRuleDefinition);
        this.ruleDefinitions.push(newRule);
        return newRule;
    }
}
