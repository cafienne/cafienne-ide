import CaseFileDefinitionDefinition from "../definition/cfid/casefileitemdefinitiondefinition";
import ServerFile from "./serverfile";

export default class CFIDFile extends ServerFile<CaseFileDefinitionDefinition> {
    createModelDefinition() {
        return new CaseFileDefinitionDefinition(this);
    }
}
