import CaseDefinition from "../../casedefinition";
import CaseParameterDefinition from "../../contract/caseparameterdefinition";
import TaskDefinition from "./taskdefinition";

export default class TaskParameterDefinition extends CaseParameterDefinition {
    constructor(importNode: Element, caseDefinition: CaseDefinition, public parent: TaskDefinition) {
        super(importNode, caseDefinition, parent);
    }

    createExportNode(parentNode: Element, tagName: string) {
        // Task parameters will not be saved, unless they are used in a non-empty mapping
        const nonEmptyMappings = this.parent.mappings.filter(mapping => (mapping.sourceRef == this.id || mapping.targetRef == this.id) && !mapping.isEmpty());
        if (nonEmptyMappings.length == 0) {
            // console.log("Parameter "+this.name+" in "+this.parent.name+" is not used in any mapping");
            return;
        }

        super.createExportNode(parentNode, tagName);
    }
}
