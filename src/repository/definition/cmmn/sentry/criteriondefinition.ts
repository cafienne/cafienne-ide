import UnnamedCMMNElementDefinition from "@repository/definition/unnamedcmmnelementdefinition";
import CaseDefinition from "../casedefinition";
import PlanItem from "../caseplan/planitem";
import IfPartDefinition from "./ifpartdefinition";
import CaseFileItemOnPartDefinition from "./casefileitemonpartdefinition";
import PlanItemOnPartDefinition from "./planitemonpartdefinition";
import ValidationContext from "@repository/validate/validation";
import PlanningTableDefinition from "../caseplan/planningtabledefinition";
import StageDefinition from "../caseplan/stagedefinition";

export default class CriterionDefinition extends UnnamedCMMNElementDefinition {
    ifPart?: IfPartDefinition;
    caseFileItemOnParts: CaseFileItemOnPartDefinition[];
    planItemOnParts: CaseFileItemOnPartDefinition[];

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

    validate(validationContext: ValidationContext) {
        super.validate(validationContext);

        this.validateSentryHasIfOrOnPart(validationContext);
        this.caseFileItemOnParts.forEach(onPart => onPart.validate(validationContext));
        this.ifPart?.validate(validationContext);
        this.validateSentryOnPartPlanItem(validationContext);
        this.validatePlanItemReferenceDiscretionaryParent(validationContext);
    }
    validateSentryHasIfOrOnPart(validationContext: ValidationContext) {
        const planItem = this.parent as PlanItem;
        if (!this.ifPart && this.caseFileItemOnParts.length === 0 && this.planItemOnParts.length === 0) {
            this.raiseError('The item "-par0-" has a -par1- without an if-part or on-part', 
                [planItem.name, this.name]);
        }
    }
    validateSentryOnPartPlanItem(validationContext: ValidationContext) {
        const planItem = this.parent as PlanItem;
        if (planItem === undefined) {
            throw new Error('Parent of sentry is not a plan item');
        }

        this.planItemOnParts.forEach(onPart => {
            if (!onPart.sourceRef) {
                this.raiseWarning('A -par0- of element "-par1-" has an onPart plan item row with no element reference',
                    [this.typeDescription, planItem.name]);
                
            } else {
                const source = this.caseDefinition.getElement(onPart.sourceRef);
                if (source === undefined) {
                    this.raiseError('A -par0- of element "-par1-" references a plan item which does not exist',
                        [this.typeDescription, planItem.name]);
                }
                if ((source as PlanItem) && (source as PlanItem)?.isDiscretionary) {
                    //onpart element can not be discretionary
                    this.raiseError ('A -par0- of element "-par1-" has an onPart plan item element ("-par2-") which is discretionary. This is not allowed.',
                        [this.typeDescription, planItem.name, source.name]);
                }
                if (!onPart.standardEvent) {
                    this.raiseWarning('A -par0- of element "-par1-" has an onPart plan item element ("-par2-") with no standard event',
                        [this.typeDescription, planItem.name, source.name]);
                }
            }
        });
    }

    /** 
     * Check if the onPart planItem reference in sentry of discretionary element refers to a plan item inside the
     * parent stage (required). PlanItem reference must be inside parent stage
    */
    validatePlanItemReferenceDiscretionaryParent(validationContext: ValidationContext) {
        //check if sentry has onPart planItems
        if (this.planItemOnParts.length == 0) {
            return;
        }

        //check if parent is discretionary
        const cmmnParentElement = this.parent as PlanItem;
        if (!cmmnParentElement.isDiscretionary) {
            return;
        }

        // check if the planItem reference points to a planItem inside the parent of the parentElement
        const parent = cmmnParentElement.parent;

        // But only if the parent is a stage inside the caseplan.
        if (parent === this.caseDefinition.casePlan) {
            return;
        }
        // get the stage of the discretionary element
        const stage = ((parent as PlanningTableDefinition).parent as StageDefinition);

        const stageChildren = stage.planItems.concat(stage.planningTable?.tableItems);
        //get the planItems from the onPart
        this.planItemOnParts.forEach(onPart => {
            const sourceRef = onPart.sourceRef;
            if (sourceRef == null || sourceRef == '') {
                //onPart planitem is not defined -> skip
                return;
            }

            //get the planItem element the onPart planItem id refers to
            const planItem = this.caseDefinition.getElement(sourceRef);
            //check if the planItem is one of the children of the parent
            //test whether the planItem is a descendant of the parentStage
            const found = stageChildren.find(child => child.id == sourceRef);
            //no descendant -> error
            if (!found) {
                this.raiseError('The -par0- of discretionary element "-par1-" has an onPart planItem reference to element "-par2-", that is outside the parent stage/case plan model "-par3-". This is not allowed',
                    [this.typeDescription, cmmnParentElement.name,  planItem.name, parent.name]);
            }
        });
    }

    get typeDescription() {
        var classname = this.constructor.name;
        return classname.substring(0, classname.length - "CriterionDefinition".length).toLowerCase() + "-sentry";
    }

}
