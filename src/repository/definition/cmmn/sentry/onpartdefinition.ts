import XML, { Element } from "../../../../util/xml";
import InternalReference from "../../references/internalreference";
import UnnamedCMMNElementDefinition from "../../unnamedcmmnelementdefinition";
import XMLSerializable from "../../xmlserializable";
import CaseDefinition from "../casedefinition";
import CaseFileItemDef from "../casefile/casefileitemdef";
import PlanItem from "../caseplan/planitem";
import CriterionDefinition from "./criteriondefinition";
import StandardEvent from "./standardevent";

abstract class OnPartDefinition<T extends CaseFileItemDef | PlanItem> extends UnnamedCMMNElementDefinition {
    standardEvent: StandardEvent;
    sourceRef: InternalReference<T>;

    constructor(importNode: Element, caseDefinition: CaseDefinition, parent: CriterionDefinition) {
        super(importNode, caseDefinition, parent);
        this.standardEvent = this.parseStandardEvent(this.parseElementText('standardEvent', ''));
        this.sourceRef = this.parseInternalReference('sourceRef');
    }

    abstract parseStandardEvent(value: string): StandardEvent;

    abstract get description(): string;

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

export default OnPartDefinition;