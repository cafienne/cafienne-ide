import XML from "@util/xml";
import UnnamedCMMNElementDefinition from "../../unnamedcmmnelementdefinition";
import CaseDefinition from "../casedefinition";
import CaseFileItemDef from "../casefile/casefileitemdef";
import PlanItem from "../caseplan/planitem";
import CriterionDefinition from "./criteriondefinition";
import XMLSerializable from "@repository/definition/xmlserializable";

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

    get defaultTransition() {
        return this.source.defaultTransition;
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
