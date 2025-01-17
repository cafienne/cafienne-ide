import CaseDefinition from "../definition/cmmn/casedefinition";
import Definitions from "./definitions";
import CaseDeployment from "./casedeployment";
import ModelDefinition from "../definition/modeldefinition";
import DefinitionDeployment from "./definitiondeployment";
import TypeDefinition from "../definition/type/typedefinition";
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
