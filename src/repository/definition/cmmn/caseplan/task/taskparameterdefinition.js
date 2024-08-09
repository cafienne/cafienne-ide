import CaseParameterDefinition from "../../contract/caseparameterdefinition";

export default class TaskParameterDefinition extends CaseParameterDefinition {
    createExportNode(parentNode, tagName) {
        // Task parameters will not be saved, unless they are used in a non-empty mapping
        const nonEmptyMappings = this.parent.mappings.filter(mapping => (mapping.sourceRef == this.id || mapping.targetRef == this.id) && !mapping.isEmpty());
        if (nonEmptyMappings.length == 0) {
            // console.log("Parameter "+this.name+" in "+this.parent.name+" is not used in any mapping");
            return;
        }

        super.createExportNode(parentNode, tagName);
    }
}
