import XML from "@util/xml";
import UnnamedCMMNElementDefinition from "../../unnamedcmmnelementdefinition";
import CaseDefinition from "../casedefinition";
import CaseFileItemDef from "../casefile/casefileitemdef";
import PlanItem from "../caseplan/planitem";
import CriterionDefinition from "./criteriondefinition";
import XMLSerializable from "@repository/definition/xmlserializable";
import ValidationContext from "@repository/validate/validation";

export default class OnPartDefinition extends UnnamedCMMNElementDefinition {
    standardEvent: string;
    sourceRef: string;

    constructor(importNode: Element, caseDefinition: CaseDefinition, parent: CriterionDefinition) {
        super(importNode, caseDefinition, parent);
        this.standardEvent = this.parseElementText('standardEvent', '');
        this.sourceRef = this.parseAttribute('sourceRef', '');
    }

    get source(): PlanItem | CaseFileItemDef {
        return this.caseDefinition.getElement(this.sourceRef);
    }

    referencesElement(element: XMLSerializable) {
        return element.id === this.sourceRef;
    }

    removeProperty(propertyName: string) {
        super.removeProperty(propertyName);
        if (propertyName === 'sourceRef') {
            // If a PlanItem is deleted or a CaseFileItem which is refered to from this on part, then we will also delete this onpart from it's sentry.
            this.removeDefinition();
        }
    }

    createExportNode(parentNode: Element, tagName: string, ...propertyNames: any[]) {
        super.createExportNode(parentNode, tagName, 'sourceRef', propertyNames);
        XML.createTextChild(XML.createChildElement(this.exportNode, 'standardEvent'), this.standardEvent);
    }

    validate(validationContext: ValidationContext) {
        super.validate(validationContext);

        const parent = this.parent as CriterionDefinition;
        const planItem = this.parent?.parent as PlanItem;

        if (!this.sourceRef) {
            this.raiseError('A -par0- of element "-par1-" has an onPart case file item entry without a reference to a case file item)', 
                [parent.typeDescription, planItem.name]);
        }
        if (!this.standardEvent) {
            this.raiseWarning('A -par0- of element "-par1-" has an onPart case file item entry without a standard event',
                [parent.typeDescription, planItem.name]);
        }
    }
}
