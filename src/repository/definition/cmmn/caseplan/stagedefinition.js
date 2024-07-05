import XML from "@util/xml";
import MilestoneDefinition from "./milestonedefinition";
import PlanItem from "./planitem";
import { TaskStageDefinition } from "./planitem";
import CaseTaskDefinition from "./task/casetaskdefinition";
import HumanTaskDefinition from "./task/humantaskdefinition";
import ProcessTaskDefinition from "./task/processtaskdefinition";
import TimerEventDefinition from "./timereventdefinition";
import UserEventDefinition from "./usereventdefinition";
import CMMNElementDefinition from "@repository/definition/cmmnelementdefinition";

export default class StageDefinition extends TaskStageDefinition {
    static get infix() {
        return 'st';
    }

    constructor(importNode, caseDefinition, parent) {
        super(importNode, caseDefinition, parent);
        this.autoComplete = this.parseBooleanAttribute('autoComplete', true);
        this.planItems = this.parseChildren(this);
    }

    /**
     * This method is used by both a PlanningTableDefinition and a StageDefinition (and also then the CasePlanDefinition)
     * It parses the children of the element and instantiates them to plan items.
     * Note: this method keeps the order of the XML in place in the list of items being returned.
     * @param {CMMNElementDefinition} parent 
     * @returns {Array<PlanItem>}
     */
    parseChildren(parent) {
        const items = [];
        const itemCreator = (element, constructor) => parent.instantiateChild(element, constructor, items);
        const childParser = (element) => {
            switch (element.tagName) {
                case 'humanTask': return itemCreator(element, HumanTaskDefinition);
                case 'caseTask': return itemCreator(element, CaseTaskDefinition);
                case 'processTask': return itemCreator(element, ProcessTaskDefinition);
                case 'milestone': return itemCreator(element, MilestoneDefinition);
                case 'userEvent': return itemCreator(element, UserEventDefinition);
                case 'timerEvent': return itemCreator(element, TimerEventDefinition);
                case 'stage': return itemCreator(element, StageDefinition);
            }
        }
        XML.getChildrenByTagName(parent.importNode, '*').forEach(childParser);
        return items;
    }

    get isStage() {
        return true;
    }

    /**
     * Creates a new plan item, along with a plan item definition of the specified type
     * @param {Function} type
     * @returns {PlanItem}
     */
    createPlanItem(type) {
        const planItem = super.createDefinition(type);
        this.planItems.push(planItem);
        return planItem;
    }

    /**
     * Return all plan items in this stage and its children, including all discretionaries.
     * @returns {Array<PlanItem>}
     */
    getAllPlanItems() {
        const items = new Array(...this.planItems); // First copy all our children

        if (this.planningTable) { // Next, copy all discretionary items in our stage
            items.push(...this.planningTable.getAllPlanItems());
        }
        this.planItems.forEach(item => { // And then also all discretionaries in our human tasks
            if (item.definition instanceof HumanTaskDefinition) {
                if (item.definition.planningTable) {
                    items.push(...item.definition.planningTable.getAllPlanItems());
                }
            }
        });
        this.planItems.forEach(item => { // Ffinally copy the items of our children of type stage.
            if (item.definition instanceof StageDefinition) {
                items.push(...item.definition.getAllPlanItems());
            }
        });

        return items;
    }

    createExportNode(parentNode, tagName = 'stage', ...propertyNames) {
        tagName = tagName === 'planItems' || tagName === 'tableItems' ? 'stage' : tagName; // Override tagName, as it comes from exporting collection property with name 'planItems' from a Stage or 'tableItems' from a PlanningTable.
        super.createExportNode(parentNode, tagName, 'autoComplete', 'planItems', 'planningTable', propertyNames);
    }
}
