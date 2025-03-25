import XML, { Element } from "../../../../util/xml";
import Validator from "../../../validate/validator";
import CMMNElementDefinition from "../../cmmnelementdefinition";
import InternalReference from "../../references/internalreference";
import UnnamedCMMNElementDefinition from "../../unnamedcmmnelementdefinition";
import XMLSerializable from "../../xmlserializable";
import CaseDefinition from "../casedefinition";
import CaseFileItemDef from "../casefile/casefileitemdef";
import PlanItem from "../caseplan/planitem";
import TimerEventDefinition from "../caseplan/timereventdefinition";
import CriterionDefinition from "./criteriondefinition";

export default class OnPartDefinition<T extends CaseFileItemDef | PlanItem> extends UnnamedCMMNElementDefinition {
    standardEvent: string;
    sourceRef: InternalReference<T>;

    constructor(importNode: Element, caseDefinition: CaseDefinition, parent: CriterionDefinition | TimerEventDefinition) {
        super(importNode, caseDefinition, parent);
        this.standardEvent = this.parseElementText('standardEvent', '');
        this.sourceRef = this.parseInternalReference('sourceRef');
    }

    validateOnPart(validator: Validator, owner: CMMNElementDefinition, description: string) {
        if (this.sourceRef.isEmpty) {
            validator.raiseError(owner, `The ${description} in ${owner} must have a sourceRef`);
        } else if (this.sourceRef.getDefinition() === undefined) {
            validator.raiseError(owner, `The ${description} in ${owner} has an unknown sourceRef '${this.sourceRef.value}'`);
        }

        if (this.standardEvent.trim().length === 0) {
            validator.raiseError(owner, `The ${description} in ${owner} must have a standardEvent`);
        } else {
            // TODO: we need to check that the standard event belongs to the list of standard events for this type of onpart
        }
    }

    get source(): T | undefined {
        return this.sourceRef.getDefinition();
    }

    referencesElement(element: XMLSerializable) {
        return this.sourceRef.references(element);
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
}
