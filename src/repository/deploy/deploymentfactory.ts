import CaseDefinition from "../definition/cmmn/casedefinition";
import ModelDefinition from "../definition/modeldefinition";
import TypeDefinition from "../definition/type/typedefinition";
import CaseDeployment from "./casedeployment";
import DefinitionDeployment from "./definitiondeployment";
import Definitions from "./definitions";
import TypeDeployment from "./typedeployment";

export default class DeploymentFactory {
    static create(definitionsDocument: Definitions, definition: ModelDefinition): DefinitionDeployment {
        if (definition instanceof CaseDefinition) {
            return new CaseDeployment(definitionsDocument, definition);
        }
        if (definition instanceof TypeDefinition) {
            return new TypeDeployment(definitionsDocument, definition);
        }
        return new DefinitionDeployment(definitionsDocument, definition);
    }
}
