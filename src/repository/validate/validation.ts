import CaseDefinition from "@repository/definition/cmmn/casedefinition";
import Repository from "@repository/repository";
import ModelDefinition from "@repository/definition/modeldefinition";
import Problem from "./problem";

export default class ValidationContext {
    /**
     * Runs the actual validation
     * 
     * @returns {ValidationContext} the validation context, containing the validated models and their problems
     */
    static runValidation(caseDefinition: CaseDefinition, repository:Repository): ValidationContext 
    {
        const validationContext = new ValidationContext(repository);

        //validate the case with its' properties
        caseDefinition.validate(validationContext);

        return validationContext;
    }

    validatedModels: ModelDefinition[];

    constructor(public repository: Repository) {
        this.validatedModels = [];
    }

    get errors(): Problem<ModelDefinition>[] {
        return this.problems.filter(p => p.isError());
    }

    get warnings(): Problem<ModelDefinition>[] {
        return this.problems.filter(p => p.isWarning());
    }

    get problems() : Problem<ModelDefinition>[] {
        return this.validatedModels.flatMap(model => model.elements.flatMap(element => element.problems));
    }

    alreadyValidated(caseDefinition: ModelDefinition): boolean {
        if (!this.validatedModels.find(x => x.id === caseDefinition.id)) {
            this.validatedModels.push(caseDefinition);
            return false;
        }
        return true;
    }
}

