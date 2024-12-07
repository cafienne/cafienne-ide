import { Element } from "../../../util/xml";
import CaseDefinition from "../cmmn/casedefinition";
import ElementDefinition from "../elementdefinition";
import ReferableElementDefinition from "../referableelementdefinition";
import ExternalReference from "../references/externalreference";
import TestcaseModelDefinition from "./testcasemodeldefinition";

export default class FixtureDefinition extends ReferableElementDefinition<TestcaseModelDefinition> {
    caseRef: ExternalReference<CaseDefinition>;

    constructor(importNode: Element, testcase: TestcaseModelDefinition, parent: ElementDefinition<TestcaseModelDefinition>) {
        super(importNode, testcase, parent);

        this.caseRef = this.parseReference('caseRef');
    }

    createExportNode(parentNode: Element) {
        super.createExportNode(parentNode, 'fixture', 'caseRef');
    }
}    
