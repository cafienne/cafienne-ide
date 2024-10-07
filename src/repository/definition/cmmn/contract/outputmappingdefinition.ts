import ParameterMappingDefinition from "./parametermappingdefinition";

export default class OutputMappingDefinition extends ParameterMappingDefinition {
    get isInputMapping() {
        return false;
    }

    createExportNode(parentNode: Element) {
        super.createExportNode(parentNode);
        // It is allowed to have empty sourceRef attributes for output mappings; note that there must be an export node (i.e., tranformation is available)
        if (this.exportNode !== undefined && !this.sourceRef) {
            this.exportNode.setAttribute('sourceRef', '');
        }
    }
}
