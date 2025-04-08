import XML, { Element } from "../../../../util/xml";
import Validator from "../../../validate/validator";
import ElementDefinition from "../../elementdefinition";
import InternalReference from "../../references/internalreference";
import UnnamedCMMNElementDefinition from "../../unnamedcmmnelementdefinition";
import XMLSerializable from "../../xmlserializable";
import CaseDefinition from "../casedefinition";
import CaseFileItemDef from "../casefile/casefileitemdef";
import PlanItem from "../caseplan/planitem";
import TimerEventDefinition from "../caseplan/timereventdefinition";
import CriterionDefinition from "./criteriondefinition";
import StandardEvent from "./standardevent";

export default class OnPartDefinition<T extends CaseFileItemDef | PlanItem> extends UnnamedCMMNElementDefinition {
    standardEvent: StandardEvent;
    sourceRef: InternalReference<T>;

    constructor(importNode: Element, caseDefinition: CaseDefinition, public parent: CriterionDefinition | TimerEventDefinition) {
        super(importNode, caseDefinition, parent);
        this.standardEvent = this.parseStandardEvent(this.parseElementText('standardEvent', ''));
        this.sourceRef = this.parseInternalReference('sourceRef');
    }

    parseStandardEvent(value: string): StandardEvent {
        throw new Error('This method must be implemented in ' + this.constructor.name);
    }

    protected get owner(): ElementDefinition<CaseDefinition> {
        if (this.parent instanceof CriterionDefinition) {
            return this.parent.parent;
        } else {
            return this.parent;
        }
    }

    validate(validator: Validator) {
        if (this.sourceRef.isEmpty) {
            validator.raiseError(this.owner, `The ${this.description} in ${this.owner} must have a sourceRef`);
        } else if (this.sourceRef.getDefinition() === undefined) {
            validator.raiseError(this.owner, `The ${this.description} in ${this.owner} has an unknown sourceRef '${this.sourceRef.value}'`);
        }

        if (this.standardEvent.isEmpty) {
            validator.raiseError(this.owner, `The ${this.description} in ${this.owner} must have a standardEvent`);
        }
        if (this.standardEvent.isInvalid) {
            validator.raiseError(this.owner, `The ${this.description} in ${this.owner} has an invalid standardEvent '${this.standardEvent.value}'`);
        }
    }

    get description(): string {
        throw new Error('This method must be implemented in ' + this.constructor.name);
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
        XML.createTextChild(XML.createChildElement(this.exportNode, 'standardEvent'), this.standardEvent.toString());
    }
}
