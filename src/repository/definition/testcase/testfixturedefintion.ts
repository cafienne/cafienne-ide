import ElementDefinition from "../elementdefinition";
import ReferableElementDefinition from "../referableelementdefinition";
import TestcaseModelDefinition from "./testcasemodeldefinition";

export default class FixtureDefinition extends ReferableElementDefinition<TestcaseModelDefinition> {
//    required: boolean = false;
//    isNew: boolean;
    constructor(importNode: Element, testcase: TestcaseModelDefinition, parent: ElementDefinition<TestcaseModelDefinition>) {
        super(importNode, testcase, parent);
//        this.required = this.parseImplementation(CafienneImplementationDefinition).parseBooleanAttribute('required', false);
//        this.isNew = false; // This property is used in the HumanTaskEditor and ProcessTaskEditor
    }

    createExportNode(parentNode: Element, tagName: string, ...propertyNames: any[]) {
        // Parameters have different tagnames depending on their type, so this must be passed.
        super.createExportNode(parentNode, tagName, propertyNames);
//        if (this.required) { // Required is a customization to the spec, put in an extension element
//            this.createImplementationNode().setAttribute('required', 'true');
    }
}    
