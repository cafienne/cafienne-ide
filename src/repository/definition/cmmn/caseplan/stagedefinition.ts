import XML from "@util/xml";
import CaseDefinition from "../casedefinition";
import MilestoneDefinition from "./milestonedefinition";
import PlanItem, { TaskStageDefinition } from "./planitem";
import PlanningTableDefinition from "./planningtabledefinition";
import CaseTaskDefinition from "./task/casetaskdefinition";
import HumanTaskDefinition from "./task/humantaskdefinition";
import ProcessTaskDefinition from "./task/processtaskdefinition";
import TimerEventDefinition from "./timereventdefinition";
import UserEventDefinition from "./usereventdefinition";
import ValidationContext from "@repository/validate/validation";

export default class StageDefinition extends TaskStageDefinition {
    autoComplete: boolean;
    planItems: PlanItem[];

    static get infix() {
        return 'st';
    }

    constructor(importNode: Element, caseDefinition: CaseDefinition, public parent: TaskStageDefinition | PlanningTableDefinition) {
        super(importNode, caseDefinition, parent);
        this.autoComplete = this.parseBooleanAttribute('autoComplete', true);
        this.planItems = this.parseChildren(this);
    }

    /**
     * This method is used by both a PlanningTableDefinition and a StageDefinition (and also then the CasePlanDefinition)
     * It parses the children of the element and instantiates them to plan items.
     * Note: this method keeps the order of the XML in place in the list of items being returned.
     */
    parseChildren(parent: StageDefinition | PlanningTableDefinition) {
        const items: PlanItem[] = [];
        const itemCreator = (element: Element, constructor: Function) => parent.instantiateChild(element, constructor, items);
        const childParser = (element: Element) => {
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
     */
    createPlanItem(type: Function) {
        const planItem: PlanItem = super.createDefinition(type);
        this.planItems.push(planItem);
        return planItem;
    }

    /**
     * Return all plan items in this stage and its children, including all discretionaries.
     * @returns {Array<PlanItem>}
     */
    getAllPlanItems(): PlanItem[] {
        const items: PlanItem[] = new Array(...this.planItems); // First copy all our children

        if (this.planningTable) { // Next, copy all discretionary items in our stage
            items.push(...this.planningTable.getAllPlanItems());
        }
        this.planItems.forEach(item => { // And then also all discretionaries in our human tasks
            if (item instanceof HumanTaskDefinition) {
                if (item.planningTable) {
                    items.push(...item.planningTable.getAllPlanItems());
                }
            }
        });
        this.planItems.forEach(item => { // Ffinally copy the items of our children of type stage.
            if (item instanceof StageDefinition) {
                items.push(...item.getAllPlanItems());
            }
        });

        return items;
    }

    createExportNode(parentNode: Element, tagName = 'stage', ...propertyNames: any[]) {
        tagName = tagName === 'planItems' || tagName === 'tableItems' ? 'stage' : tagName; // Override tagName, as it comes from exporting collection property with name 'planItems' from a Stage or 'tableItems' from a PlanningTable.
        super.createExportNode(parentNode, tagName, 'autoComplete', 'planItems', 'planningTable', propertyNames);
    }

    validate(validationContext: ValidationContext) {
        super.validate(validationContext);

        StageDefinition.validatePlanItems(validationContext, this.planItems);
        if (this.planningTable) {
            this.planningTable.validate(validationContext);
        }

        // validate plan item nesting: not needed, because object structure forces it
        
        // validate autocomplete
        if (!this.autoComplete) {
            if (!this.planningTable || this.planningTable.tableItems.length == 0) {
                this.raiseWarning('The stage "-par0-" has the property autocomplete=FALSE. It is appropriate that this stage contains discretionary elements', 
                    [this.name]);
            }
        }

        // validate more then one child
        const numPlanItems = this.planItems.length;
        const numDiscretionaryItems = this.planningTable ? this.planningTable.tableItems.length : 0;
        if (numPlanItems + numDiscretionaryItems <= 1) {
            this.raiseWarning('The stage "-par0-" contains zero or one plan item, this is allowed but should be avoided',
                [this.name]);
        }

    }
    static validatePlanItems(validationContext:ValidationContext, planItems: PlanItem[]) {
        const stageName = this.name;
        for (let planItem of planItems) {
            if (planItem.name === "") 
            {
                planItem.raiseError('A plan item in stage "-par0-" has no name', [stageName]);
            }

            switch (planItem.constructor.name) {
                case 'HumanTaskDefinition':
                    (planItem as HumanTaskDefinition).validate(validationContext);
                    break;
                case 'CaseTaskDefinition':
                    (planItem as CaseTaskDefinition).validate(validationContext);
                    break;
                case 'ProcessTaskDefinition':
                    (planItem as ProcessTaskDefinition).validate(validationContext);
                    break;
                case 'MilestoneDefinition':
                    (planItem as MilestoneDefinition).validate(validationContext);
                    break;
                case 'UserEventDefinition':
                    (planItem as UserEventDefinition).validate(validationContext);
                    break;
                case 'TimerEventDefinition':
                    (planItem as TimerEventDefinition).validate(validationContext);
                    break;
                case 'StageDefinition':
                    (planItem as StageDefinition).validate(validationContext);
                    break;
                default:
                    planItem.raiseWarning('The plan item "-par0-" cannot be validated, because type is "-par1-"', 
                        [planItem.name, planItem.constructor.name]);
                    break;
            }
        }
    }
}
